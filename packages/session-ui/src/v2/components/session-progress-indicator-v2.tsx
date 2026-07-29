import { splitProps, type ComponentProps } from "solid-js"
import "./session-progress-indicator-v2.css"

export function SessionProgressIndicatorV2(props: ComponentProps<"svg">) {
  const [local, rest] = splitProps(props, ["class", "classList", "width", "height"])
  return (
    <svg
      {...rest}
      class={local.class}
      classList={local.classList}
      width={local.width ?? 16}
      height={local.height ?? 16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-component="session-progress-indicator-v2"
      aria-hidden={rest["aria-hidden"] ?? "true"}
    >
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.1" />
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="8 28" stroke-linecap="round" class="progress-ring-outer" />
      <circle cx="8" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 18" stroke-linecap="round" class="progress-ring-inner" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" class="progress-ring-core" />
    </svg>
  )
}
