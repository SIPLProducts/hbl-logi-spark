import { useEffect, useState, useSyncExternalStore } from "react";
import { getPendingApiCalls, subscribeApiLoading } from "@/lib/api-loading";

const SHOW_DELAY_MS = 200; // skip the spinner for very fast calls (no flicker)
const HIDE_DELAY_MS = 150; // keep it steady across back-to-back calls

// Bar animation delays of the "line-scale-pulse-out-rapid" loader used by the Angular app
// (ngx-spinner): the centre bar leads, the outer bars follow.
const BAR_DELAYS = ["-0.4s", "-0.65s", "-0.9s", "-0.65s", "-0.4s"];

/**
 * Global API loading indicator — same look as the Angular application's ngx-spinner
 * (type "line-scale-pulse-out-rapid", medium, white on a full-screen rgba(0,0,0,0.8)
 * backdrop with "Please Wait Loading..."). It never intercepts clicks or typing
 * (pointer-events-none), so it doesn't change how any screen behaves.
 */
export function ApiLoader() {
  const pending = useSyncExternalStore(subscribeApiLoading, getPendingApiCalls, () => 0);
  const busy = pending > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(busy),
      busy ? SHOW_DELAY_MS : HIDE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [busy]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80"
    >
      <div className="flex h-16 items-center" aria-hidden="true">
        {BAR_DELAYS.map((delay, i) => (
          <div
            key={i}
            className="mx-1 h-16 w-2 bg-white"
            style={{
              animation: "api-line-scale-pulse-out-rapid 0.9s cubic-bezier(.11,.49,.38,.78) infinite",
              animationDelay: delay,
            }}
          />
        ))}
      </div>
      <p className="mt-4 text-[16px] text-white">Please Wait Loading...</p>
    </div>
  );
}
