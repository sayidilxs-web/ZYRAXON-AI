# ZYRAXON AI — Lovable Backend Endpoints Setup Prompt

Copy this entire prompt and paste it into Lovable AI (zyraxonai.lovable.app) to set up ALL backend endpoints.

---

## PROMPT START

I need you to create a complete backend API for ZYRAXON AI using Supabase (PostgreSQL + Edge Functions). This is an AI-powered software factory ecosystem. Here are ALL the endpoints I need:

---

### 1. AUTHENTICATION — GitHub OAuth

**POST `/api/auth/github`**
- Purpose: Exchange GitHub OAuth authorization code for access token
- Request body: `{ code: string, state?: string }`
- Logic:
  1. Exchange code with GitHub: `POST https://github.com/login/oauth/access_token` with `client_id`, `client_secret`, `code`
  2. Get user info: `GET https://api.github.com/user` with the access token
  3. Get user emails: `GET https://api.github.com/user/emails` with the access token
  4. Create/update user in Supabase `users` table
  5. Return: `{ user: { id, login, name, avatar_url, email }, token: "jwt_token" }`

**GET `/api/auth/github/callback`**
- Purpose: Handle GitHub OAuth redirect
- Logic: Redirect to app with code and state params

---

### 2. USER MANAGEMENT

**GET `/api/users/:username`**
- Purpose: Get user profile
- Response: `{ id, login, name, avatar_url, bio, blog, location, email, created_at, public_repos, followers, following }`

**PATCH `/api/users/:username`**
- Purpose: Update user profile (authenticated only)
- Request body: `{ bio?, blog?, location? }`

**GET `/api/users/:username/stats`**
- Purpose: Get user stats (items published, likes received, followers count)
- Response: `{ items_count, likes_received, followers_count, following_count }`

---

### 3. ECOSYSTEM ITEMS (Website, SDK, PDF, AI Bot, Plugin, Template, Mobile App, API)

**GET `/api/ecosystem/items`**
- Purpose: List all published ecosystem items
- Query params: `?category=website&sort=newest&page=1&limit=20&search=keyword`
- Categories: `website`, `sdk`, `pdf`, `ai_bot`, `plugin`, `template`, `mobile_app`, `api`
- Response: `{ items: [...], total: number, page: number, has_more: boolean }`

**POST `/api/ecosystem/items`**
- Purpose: Publish a new item to ecosystem (authenticated only)
- Request body: `{ title, description, category, content?, tags?, github_url?, demo_url?, thumbnail_url? }`
- Response: `{ id, title, slug, category, created_at }`

**GET `/api/ecosystem/items/:id`**
- Purpose: Get single item details
- Response: `{ id, title, slug, description, category, content, author, tags, github_url, demo_url, thumbnail_url, likes_count, comments_count, created_at, updated_at }`

**PATCH `/api/ecosystem/items/:id`**
- Purpose: Update item (owner only)
- Request body: `{ title?, description?, content?, tags?, github_url?, demo_url?, thumbnail_url? }`

**DELETE `/api/ecosystem/items/:id`**
- Purpose: Delete item (owner only)

**GET `/api/ecosystem/items/:id/versions`**
- Purpose: Get version history of an item
- Response: `{ versions: [{ id, version, description, created_at, downloads }] }`

**POST `/api/ecosystem/items/:id/versions`**
- Purpose: Publish new version (owner only)
- Request body: `{ version, description, content? }`

---

### 4. LIKES

**POST `/api/ecosystem/items/:id/like`**
- Purpose: Like an item (authenticated only)
- Response: `{ likes_count: number, liked: true }`

**DELETE `/api/ecosystem/items/:id/like`**
- Purpose: Unlike an item (authenticated only)
- Response: `{ likes_count: number, liked: false }`

**GET `/api/ecosystem/items/:id/likes`**
- Purpose: Get users who liked this item
- Response: `{ users: [{ id, login, avatar_url }], total: number }`

**GET `/api/users/:username/likes`**
- Purpose: Get items liked by user
- Response: `{ items: [...] }`

---

### 5. COMMENTS

**GET `/api/ecosystem/items/:id/comments`**
- Purpose: Get comments on an item
- Query params: `?page=1&limit=20`
- Response: `{ comments: [{ id, author, content, created_at, updated_at, replies: [...] }], total: number }`

**POST `/api/ecosystem/items/:id/comments`**
- Purpose: Add comment (authenticated only)
- Request body: `{ content, parent_id? }` (parent_id for replies)
- Response: `{ id, author, content, created_at }`

**PATCH `/api/comments/:commentId`**
- Purpose: Edit comment (author only)
- Request body: `{ content }`

**DELETE `/api/comments/:commentId`**
- Purpose: Delete comment (author or item owner)

---

### 6. FOLLOWERS

**POST `/api/users/:username/follow`**
- Purpose: Follow a user (authenticated only)
- Response: `{ following: true, followers_count: number }`

**DELETE `/api/users/:username/follow`**
- Purpose: Unfollow a user (authenticated only)
- Response: `{ following: false, followers_count: number }`

**GET `/api/users/:username/followers`**
- Purpose: Get user's followers
- Response: `{ users: [...], total: number }`

**GET `/api/users/:username/following`**
- Purpose: Get who user follows
- Response: `{ users: [...], total: number }`

---

### 7. SEARCH

**GET `/api/search`**
- Purpose: Global search across items and users
- Query params: `?q=keyword&type=all&page=1&limit=20`
- Type: `all`, `items`, `users`
- Response: `{ items: [...], users: [...], total: number }`

**GET `/api/ecosystem/categories`**
- Purpose: Get category stats
- Response: `{ categories: [{ name, count, icon }] }`

---

### 8. MARKETPLACE (zyraxonai.lovable.app)

**GET `/api/marketplace/items`**
- Purpose: List marketplace items (from all users)
- Query params: `?category=&sort=trending&page=1&limit=20`
- Sort: `newest`, `trending`, `most_liked`, `most_commented`
- Response: `{ items: [...], total: number, has_more: boolean }`

**POST `/api/marketplace/items/:id/publish`**
- Purpose: Publish item to marketplace (owner only, item must be public)
- Response: `{ published: true, marketplace_url }`

**DELETE `/api/marketplace/items/:id/unpublish`**
- Purpose: Remove from marketplace (owner only)

**GET `/api/marketplace/trending`**
- Purpose: Get trending items (last 7 days, sorted by likes+comments)
- Response: `{ items: [...] }`

**GET `/api/marketplace/featured`**
- Purpose: Get featured/curated items
- Response: `{ items: [...] }`

---

### 9. AI CONNECTION

**POST `/api/ai/session`**
- Purpose: Create AI connection session
- Request body: `{ user_id, capabilities: string[] }`
- Response: `{ session_id, status: "active", capabilities: [...], created_at }`

**GET `/api/ai/session/:sessionId`**
- Purpose: Get AI session status
- Response: `{ session_id, status, last_active, events_count }`

**POST `/api/ai/session/:sessionId/event`**
- Purpose: Log AI event
- Request body: `{ event_type, data? }`
- Response: `{ logged: true }`

**DELETE `/api/ai/session/:sessionId`**
- Purpose: End AI session

---

### 10. SHARE API (Session Sharing)

**POST `/api/public/shares`**
- Purpose: Create a public shared session
- Request body: `{ title, description?, messages: [...], metadata? }`
- Response: `{ shareID, url, created_at }`

**POST `/api/public/shares/:shareID/sync`**
- Purpose: Sync/update shared session data
- Request body: `{ messages: [...], metadata? }`

**DELETE `/api/public/shares/:shareID`**
- Purpose: Remove shared session

**GET `/api/public/shares/:shareID/data`**
- Purpose: Get shared session data
- Response: `{ shareID, title, messages, metadata, created_at }`

---

### 11. GITHUB APP TOKEN EXCHANGE

**POST `/api/exchange_github_app_token`**
- Purpose: Exchange OIDC token for GitHub App installation token
- Request body: `{ token: string }`
- Logic: Verify OIDC token, exchange with GitHub App, return installation access token
- Response: `{ access_token, permissions, repositories }`

**POST `/api/exchange_github_app_token_with_pat`**
- Purpose: Exchange mock token for PAT-based access (dev/testing)
- Request body: `{ token: string }`
- Response: `{ access_token, permissions, repositories }`

---

### 12. WEBHOOKS

**POST `/api/webhooks/github`**
- Purpose: Handle GitHub webhook events (push, release, issues)
- Logic: Verify webhook signature, process event, update relevant items
- Events: `push`, `release`, `issues`, `pull_request`

**POST `/api/webhooks/ai`**
- Purpose: Handle AI callback events
- Request body: `{ event_type, session_id, data }`

---

### 13. ANALYTICS

**GET `/api/analytics/downloads/:itemId`**
- Purpose: Get download count for an item
- Response: `{ downloads: number, history: [{ date, count }] }`

**GET `/api/analytics/views/:itemId`**
- Purpose: Get view count
- Response: `{ views: number, unique_views: number }`

**POST `/api/analytics/track`**
- Purpose: Track an event (view, download, click)
- Request body: `{ event_type, item_id?, user_id?, metadata? }`

---

### 14. ADMIN

**GET `/api/admin/stats`**
- Purpose: Get platform stats (admin only)
- Response: `{ total_users, total_items, total_likes, total_comments, active_sessions }`

**GET `/api/admin/items/pending`**
- Purpose: Get items pending review (admin only)

**PATCH `/api/admin/items/:id/approve`**
- Purpose: Approve item (admin only)

**PATCH `/api/admin/items/:id/reject`**
- Purpose: Reject item (admin only)

---

### 15. NOTIFICATIONS

**GET `/api/notifications`**
- Purpose: Get user notifications (authenticated)
- Query params: `?unread=true&page=1&limit=20`

**PATCH `/api/notifications/:id/read`**
- Purpose: Mark notification as read

**POST `/api/notifications/read-all`**
- Purpose: Mark all notifications as read

---

### 16. RATE LIMITING

All endpoints should have rate limiting:
- Authenticated users: 100 requests/minute
- Unauthenticated: 20 requests/minute
- Admin: 500 requests/minute

---

### DATABASE TABLES (Supabase PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id INTEGER UNIQUE NOT NULL,
  login TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  blog TEXT,
  location TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ecosystem Items
CREATE TABLE ecosystem_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('website','sdk','pdf','ai_bot','plugin','template','mobile_app','api')),
  content JSONB,
  tags TEXT[],
  github_url TEXT,
  demo_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  marketplace_published BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(author_id, slug)
);

-- Item Versions
CREATE TABLE item_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES ecosystem_items(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  description TEXT,
  content JSONB,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Likes
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES ecosystem_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id),
  item_id UUID REFERENCES ecosystem_items(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Follows
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id),
  following_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Shared Sessions
CREATE TABLE shared_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT UNIQUE NOT NULL,
  author_id UUID REFERENCES users(id),
  title TEXT,
  description TEXT,
  messages JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Sessions
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','ended')),
  capabilities TEXT[],
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Events
CREATE TABLE ai_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES ai_sessions(session_id),
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  item_id UUID,
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_items_category ON ecosystem_items(category);
CREATE INDEX idx_items_author ON ecosystem_items(author_id);
CREATE INDEX idx_items_status ON ecosystem_items(status);
CREATE INDEX idx_items_marketplace ON ecosystem_items(marketplace_published);
CREATE INDEX idx_likes_item ON likes(item_id);
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_comments_item ON comments(item_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read);
```

---

### SUPABASE EDGE FUNCTIONS

Create these Edge Functions for business logic:

1. **`auth-github`** — GitHub OAuth token exchange
2. **`marketplace-trending`** — Calculate trending items (cached, refresh every hour)
3. **`ai-session-create`** — Create AI connection session
4. **`ai-session-event`** — Log AI events and sync
5. **`webhook-github`** — Process GitHub webhooks
6. **`exchange-github-token`** — GitHub App token exchange
7. **`analytics-track`** — Batch analytics event processing
8. **`notification-create`** — Create and send notifications

---

### SECURITY RULES (Row Level Security)

```sql
-- Users can read anyone, update only themselves
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Items: public read, owner write/delete
ALTER TABLE ecosystem_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public items" ON ecosystem_items FOR SELECT USING (status = 'published');
CREATE POLICY "Owner full access" ON ecosystem_items FOR ALL USING (auth.uid() = author_id);

-- Likes: public read, authenticated write
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated unlike" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, author write/delete, item owner can delete
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Author access" ON comments FOR ALL USING (auth.uid() = author_id);

-- Follows: public read, authenticated write
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Authenticated follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Authenticated unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Shared sessions: public read for published, author write
ALTER TABLE shared_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public shared sessions" ON shared_sessions FOR SELECT USING (true);
CREATE POLICY "Author access" ON shared_sessions FOR ALL USING (auth.uid() = author_id);

-- AI sessions: user read own, system write
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User own sessions" ON ai_sessions FOR SELECT USING (auth.uid() = user_id);

-- Notifications: user read own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
```

---

### ENVIRONMENT VARIABLES (Lovable/Supabase)

Set these in Lovable project settings:
```
GITHUB_CLIENT_ID=<from GitHub OAuth App>
GITHUB_CLIENT_SECRET=<from GitHub OAuth App>
SUPABASE_URL=<your Supabase project URL>
SUPABASE_ANON_KEY=<your Supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service role key>
GITHUB_APP_ID=<from GitHub App settings>
GITHUB_APP_PRIVATE_KEY=<from GitHub App PEM>
WEBHOOK_SECRET=<for GitHub webhook signature verification>
```

---

### API RESPONSE FORMAT

All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error format:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found"
  }
}
```

---

### PAGINATION FORMAT

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "has_more": true
  }
}
```

---

### SORTING OPTIONS

- `newest` — Created date descending
- `oldest` — Created date ascending
- `most_liked` — Likes count descending
- `most_commented` — Comments count descending
- `trending` — Weighted: (likes * 3 + comments * 2 + views * 1) last 7 days
- `downloads` — Downloads count descending

---

## PROMPT END

After setting up all endpoints, create a test user and verify:
1. GitHub OAuth login works
2. User can publish an item
3. Like/Comment/Follow work
4. Marketplace listing shows items
5. Share API creates shareable links
6. AI session can be created and events logged
