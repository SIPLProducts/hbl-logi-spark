import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/app-shell";
import faviconAsset from "../assets/hbl-favicon.png.asset.json";
import favicon from "../favicon.ico";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;

    const hasActiveSession =
      localStorage.getItem("isLoggedIn") === "true" &&
      sessionStorage.getItem("sessionActive") === "true";

    if (!hasActiveSession && location.pathname !== "/login") {
      localStorage.removeItem("userData");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("sessionActive");
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HBL - PRAVAH" },
      { name: "description", content: "Logistics Execution console for HBL Power Systems — inbound, outbound, and transportation operations." },
      { name: "author", content: "HBL Power Systems" },
      { property: "og:title", content: "HBL - PRAVAH" },
      { property: "og:description", content: "Logistics Execution console for HBL Power Systems — inbound, outbound, and transportation operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@HBLPower" },
      { name: "twitter:title", content: "HBL - PRAVAH" },
      { name: "twitter:description", content: "Logistics Execution console for HBL Power Systems — inbound, outbound, and transportation operations." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/lMuNufL1WVQqWEBzmwb74CIjyID3/social-images/social-1781261104787-Sharvi_Infotech_logo.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/lMuNufL1WVQqWEBzmwb74CIjyID3/social-images/social-1781261104787-Sharvi_Infotech_logo.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/x-icon", href: favicon },
      { rel: "apple-touch-icon", href: favicon },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname === "/login";

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isAuthRoute) {
      setAuthChecked(true);
      return;
    }
    const hasActiveSession =
      localStorage.getItem("isLoggedIn") === "true" &&
      sessionStorage.getItem("sessionActive") === "true";

    if (!hasActiveSession) {
      localStorage.removeItem("userData");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("sessionActive");
      router.navigate({ to: "/login", replace: true });
      return;
    }
    setAuthChecked(true);
  }, [isAuthRoute, pathname, router]);

  // Inactivity / Idle Timer: 30 minutes
  useEffect(() => {
    if (isAuthRoute) return;

    const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    let timeoutId: number;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        localStorage.removeItem("userData");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("sessionActive");
        window.location.href = "/login?session=timeout";
      }, TIMEOUT_MS);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthRoute]);

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthRoute ? (
        <Outlet />
      ) : authChecked ? (
        <AppShell><Outlet /></AppShell>
      ) : null}
    </QueryClientProvider>
  );
}
