import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import hblLogo from "@/assets/hbl-logo.png.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login · HBL Logistics Execution" },
      {
        name: "description",
        content:
          "Sign in to HBL Power Systems' Logistics Execution module to manage dispatch, shipment, and freight operations.",
      },
      { property: "og:title", content: "Login · HBL Logistics Execution" },
      {
        property: "og:description",
        content: "Secure sign in to the HBL Logistics Execution module.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Please enter your user name")
    .max(100, "User name must be under 100 characters"),
  password: z
    .string()
    .min(1, "Please enter your password")
    .max(100, "Password must be under 100 characters"),
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ username, password });
    if (!result.success) {
      const next: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as "username" | "password";
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Signed in successfully");
      navigate({ to: "/" });
    }, 600);
  };

  return (
    <main className="min-h-screen w-full grid md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] bg-slate-50">
      {/* Left panel — form */}
      <section className="flex flex-col px-8 sm:px-14 py-10 bg-white">
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
          <div className="mb-10 flex items-center gap-3">
            <img
              src={hblLogo.url}
              alt="HBL Power Systems"
              className="h-16 w-auto object-contain"
            />
          </div>

          <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-slate-900">
            Sign in to your account
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5">
            Logistics Execution Module
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-[12px] font-semibold uppercase tracking-wide text-slate-700"
              >
                User Name
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter User Name"
                autoComplete="username"
                maxLength={100}
                aria-invalid={!!errors.username}
                className={
                  "w-full h-11 px-3.5 rounded-lg border bg-white text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow " +
                  (errors.username
                    ? "border-destructive focus:border-destructive"
                    : "border-slate-300 focus:border-primary")
                }
              />
              {errors.username && (
                <p className="text-[11.5px] text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[12px] font-semibold uppercase tracking-wide text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  maxLength={100}
                  aria-invalid={!!errors.password}
                  className={
                    "w-full h-11 pl-3.5 pr-11 rounded-lg border bg-white text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow " +
                    (errors.password
                      ? "border-destructive focus:border-destructive"
                      : "border-slate-300 focus:border-primary")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 grid place-items-center px-3 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11.5px] text-destructive">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-primary text-white text-[13.5px] font-semibold shadow-cta hover:opacity-95 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Log In <LogIn className="size-4" />
                </>
              )}
            </button>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => toast.info("Please contact your administrator")}
                className="text-[12.5px] font-medium text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>

        <p className="text-[11px] text-slate-400 mt-8 text-center md:text-left">
          © {new Date().getFullYear()} HBL Power Systems. All Rights Reserved.
        </p>
      </section>

      {/* Right panel — collage */}
      <aside className="relative hidden md:block overflow-hidden bg-slate-900">
        <div className="absolute inset-0 grid grid-cols-3">
          <div className="relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80"
              alt="Containers at port"
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
          </div>
          <div className="relative overflow-hidden -mx-px">
            <img
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80"
              alt="Truck on highway"
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
          </div>
          <div className="relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1577712283696-3eaff03fd54e?auto=format&fit=crop&w=1200&q=80"
              alt="Container ship at sea"
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
          </div>
        </div>

        {/* Bottom branding band */}
        <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200">
          <div className="px-10 py-6 flex items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.05] tracking-tight text-slate-900 uppercase">
                Logistic
                <br />
                Execution Module
              </h2>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <img
                src={hblLogo.url}
                alt="HBL"
                className="h-12 w-auto object-contain"
              />
              <span className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-slate-500">
                HBL Engineering Limited
              </span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
