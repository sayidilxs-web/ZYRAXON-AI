# GitHub OAuth Setup Guide for ZYRAXON AI (Lovable)

## Step 1: Register GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** `ZYRAXON AI`
   - **Homepage URL:** `https://zyraxonai.lovable.app`
   - **Authorization callback URL:** `https://zyraxonai.lovable.app/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** — copy it immediately (shown only once!)

## Step 2: Set Environment Variables in Lovable

Go to your Lovable project → Settings → Environment Variables:

```
GITHUB_CLIENT_ID=paste_here_client_id
GITHUB_CLIENT_SECRET=paste_here_client_secret
```

## Step 3: Create the Auth Edge Function in Lovable

Create file: `supabase/functions/auth-github/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: Deno.env.get("GITHUB_CLIENT_ID"),
        client_secret: Deno.env.get("GITHUB_CLIENT_SECRET"),
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: tokenData.error_description }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "ZYRAXON-AI",
      },
    });
    const githubUser = await userResponse.json();

    // Get user emails
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "ZYRAXON-AI",
      },
    });
    const emails = await emailsResponse.json();
    const primaryEmail = emails.find((e: any) => e.primary)?.email;

    // Supabase setup
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert user
    const { data: user, error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          github_id: githubUser.id,
          login: githubUser.login,
          name: githubUser.name || githubUser.login,
          avatar_url: githubUser.avatar_url,
          bio: githubUser.bio,
          blog: githubUser.blog,
          location: githubUser.location,
          email: primaryEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "github_id" }
      )
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    // Create JWT for session
    const jwtPayload = {
      sub: user.id,
      iss: "zyraxon-ai",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    };

    // Use Supabase's sign function or create a simple token
    const token = btoa(JSON.stringify(jwtPayload));

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          avatar_url: user.avatar_url,
          email: user.email,
          bio: user.bio,
          blog: user.blog,
          location: user.location,
        },
        token,
        access_token: accessToken,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

## Step 4: Frontend Login Flow

In your Lovable frontend, create the login component:

```typescript
// components/LoginButton.tsx
const GITHUB_CLIENT_ID = "YOUR_GITHUB_CLIENT_ID"; // or use env var
const REDIRECT_URI = "https://zyraxonai.lovable.app/api/auth/github/callback";

export function loginWithGitHub() {
  const state = crypto.randomUUID();
  localStorage.setItem("github_oauth_state", state);
  
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=read:user,user:email&state=${state}`;
  
  window.location.href = url;
}

// Handle callback
export async function handleGitHubCallback(code: string, state: string) {
  const savedState = localStorage.getItem("github_oauth_state");
  if (state !== savedState) {
    throw new Error("Invalid state parameter");
  }

  const response = await fetch("https://zyraxonai.lovable.app/api/auth/github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();
  
  // Store user data and token
  localStorage.setItem("zyraxon_user", JSON.stringify(data.user));
  localStorage.setItem("zyraxon_token", data.token);
  localStorage.setItem("github_access_token", data.access_token);
  
  return data;
}
```

## Step 5: Callback Page

Create a callback page at `/auth/callback`:

```typescript
// pages/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleGitHubCallback } from "../components/LoginButton";

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state) {
      handleGitHubCallback(code, state)
        .then(() => navigate("/ecosystem"))
        .catch((err) => setError(err.message));
    } else {
      setError("Missing code or state parameter");
    }
  }, [searchParams, navigate]);

  if (error) {
    return <div>Login failed: {error}</div>;
  }

  return <div>Logging in with GitHub...</div>;
}
```

## Step 6: GitHub Data Storage (User's Own Repo)

After login, the frontend should:

1. **Create private repo** `zyraxon-ecosystem-data` in user's GitHub
2. **Store user data** in that repo:
   - `profile.json` — User profile
   - `likes.json` — User's likes
   - `comments.json` — User's comments
   - `follows.json` — User's follows
   - `published.json` — User's published items
   - `ai_connection.json` — AI session data

3. **Use GitHub API** directly from frontend:
   ```
   Authorization: Bearer {github_access_token}
   ```

## Summary

| What | Where |
|------|-------|
| OAuth App | github.com/settings/developers |
| Client ID + Secret | From OAuth App settings |
| Env vars in Lovable | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Auth function | `supabase/functions/auth-github/index.ts` |
| Callback URL | `/api/auth/github/callback` |
| Login URL | `https://github.com/login/oauth/authorize?client_id=...` |
| User data storage | User's own GitHub repo (private) |
