import { createSignal, Show, onCleanup, onMount } from "solid-js"
import { startDeviceFlow, pollDeviceCode, completeDeviceFlowLogin } from "../services/auth"
import { IconLoader, IconCheck, IconX, IconDeviceCode, IconCopy } from "./Icons"

interface AuthCallbackProps {
  code?: string
  state?: string
  onSuccess?: () => void
  onError?: (msg: string) => void
}

export const AuthCallback = (props: AuthCallbackProps) => {
  const [mode, setMode] = createSignal<"redirect" | "device" | "polling" | "success" | "error">("device")
  const [userCode, setUserCode] = createSignal("")
  const [verificationUri, setVerificationUri] = createSignal("")
  const [errorMsg, setErrorMsg] = createSignal("")
  const [copied, setCopied] = createSignal(false)
  let pollInterval: number | undefined

  onMount(() => {
    if (props.code && props.state) {
      setMode("redirect")
      handleRedirectCallback()
      return
    }
    initiateDeviceLogin()
  })

  onCleanup(() => {
    if (pollInterval) clearInterval(pollInterval)
  })

  const handleRedirectCallback = async () => {
    setMode("redirect")
    try {
      const { handleGitHubCallback } = await import("../services/auth")
      const user = await handleGitHubCallback(props.code!, props.state!)
      if (user) {
        setMode("success")
        setTimeout(() => props.onSuccess?.(), 1500)
      } else {
        setMode("error")
        setErrorMsg("Login failed. Please try again.")
        props.onError?.("Login failed")
      }
    } catch (err: any) {
      setMode("error")
      setErrorMsg(err.message || "Something went wrong")
      props.onError?.(err.message)
    }
  }

  const initiateDeviceLogin = async () => {
    setMode("device")
    try {
      const data = await startDeviceFlow()
      setUserCode(data.user_code)
      setVerificationUri(data.verification_uri)
      setMode("polling")

      pollInterval = window.setInterval(async () => {
        const result = await pollDeviceCode()
        if (result) {
          if (pollInterval) clearInterval(pollInterval)
          const user = await completeDeviceFlowLogin(result.access_token)
          if (user) {
            setMode("success")
            setTimeout(() => props.onSuccess?.(), 1500)
          } else {
            setMode("error")
            setErrorMsg("Failed to complete login.")
            props.onError?.("Login failed")
          }
        }
      }, (data.interval || 5) * 1000)
    } catch (err: any) {
      setMode("error")
      setErrorMsg(err.message || "Failed to start device login")
      props.onError?.(err.message)
    }
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(userCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openVerification = () => {
    window.open(verificationUri(), "_blank")
  }

  return (
    <div class="h-screen w-screen bg-[#0d1117] flex items-center justify-center">
      <div class="text-center max-w-md">
        <Show when={mode() === "device" || mode() === "polling"}>
          <div class="mb-6">
            <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#1f6feb] to-[#8957e5] flex items-center justify-center">
              <IconDeviceCode class="text-white" size={36} />
            </div>
            <h2 class="text-xl font-bold text-[#c9d1d9] mb-2">Sign in with GitHub</h2>
            <p class="text-sm text-[#8b949e]">Follow these steps to authorize ZYRAXON</p>
          </div>

          <div class="bg-[#161b22] border border-[#21262d] rounded-xl p-6 mb-6">
            <ol class="space-y-4 text-left">
              <li class="flex gap-3">
                <span class="w-6 h-6 rounded-full bg-[#1f6feb] text-white text-xs flex items-center justify-center shrink-0 font-bold">1</span>
                <div>
                  <p class="text-sm text-[#c9d1d9]">Open GitHub in your browser</p>
                  <button onClick={openVerification} class="text-xs text-[#58a6ff] hover:underline mt-1">
                    {verificationUri()}
                  </button>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-6 h-6 rounded-full bg-[#1f6feb] text-white text-xs flex items-center justify-center shrink-0 font-bold">2</span>
                <div>
                  <p class="text-sm text-[#c9d1d9]">Enter this code</p>
                  <div class="flex items-center gap-2 mt-1">
                    <code class="text-2xl font-mono font-bold text-[#58a6ff] tracking-widest bg-[#0d1117] px-4 py-2 rounded-lg border border-[#21262d]">
                      {userCode()}
                    </code>
                    <button
                      onClick={copyCode}
                      class="p-2 hover:bg-[#21262d] rounded-lg transition-colors"
                      title="Copy code"
                    >
                      <Show when={copied()} fallback={<IconCopy class="text-[#8b949e]" size={16} />}>
                        <IconCheck class="text-[#3fb950]" size={16} />
                      </Show>
                    </button>
                  </div>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-6 h-6 rounded-full bg-[#1f6feb] text-white text-xs flex items-center justify-center shrink-0 font-bold">3</span>
                <p class="text-sm text-[#c9d1d9]">Click <strong>"Authorize ZYRAXON"</strong> on GitHub</p>
              </li>
            </ol>
          </div>

          <div class="flex items-center justify-center gap-2 text-sm text-[#8b949e]">
            <IconLoader class="text-[#58a6ff]" size={16} />
            <span>Waiting for authorization...</span>
          </div>

          <button
            onClick={() => {
              if (pollInterval) clearInterval(pollInterval)
              props.onSuccess?.()
            }}
            class="mt-4 text-xs text-[#484f58] hover:text-[#8b949e] transition-colors"
          >
            Cancel
          </button>
        </Show>

        <Show when={mode() === "redirect"}>
          <div class="w-16 h-16 border-4 border-[#21262d] border-t-[#58a6ff] rounded-full animate-spin mx-auto mb-6" />
          <h2 class="text-xl font-semibold text-[#c9d1d9] mb-2">Logging in with GitHub...</h2>
          <p class="text-[#8b949e]">Please wait while we verify your account</p>
        </Show>

        <Show when={mode() === "success"}>
          <div class="w-16 h-16 bg-[#238636] rounded-full flex items-center justify-center mx-auto mb-6">
            <IconCheck class="text-white" size={32} />
          </div>
          <h2 class="text-xl font-semibold text-[#c9d1d9] mb-2">Welcome!</h2>
          <p class="text-[#8b949e]">Redirecting to Ecosystem...</p>
        </Show>

        <Show when={mode() === "error"}>
          <div class="w-16 h-16 bg-[#da3633] rounded-full flex items-center justify-center mx-auto mb-6">
            <IconX class="text-white" size={32} />
          </div>
          <h2 class="text-xl font-semibold text-[#c9d1d9] mb-2">Login Failed</h2>
          <p class="text-[#8b949e] mb-6">{errorMsg()}</p>
          <button
            class="px-6 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg transition-colors"
            onClick={() => initiateDeviceLogin()}
          >
            Try Again
          </button>
        </Show>
      </div>
    </div>
  )
}
