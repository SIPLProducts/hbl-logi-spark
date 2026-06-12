import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import hblLogo from "@/assets/hbl-logo.png.asset.json";
import slide1 from "@/assets/hbl-vision.png.asset.json";
import slide2 from "@/assets/hbl-values.jpeg.asset.json";
import slide3 from "@/assets/le-collage-1.png.asset.json";
import slide4 from "@/assets/le-collage-2.jpg.asset.json";
import slide5 from "@/assets/le-truck.jpg.asset.json";
import slide6 from "@/assets/le-fleet.png.asset.json";

const slides = [
  { url: slide1.url, alt: "HBL Vision" },
  { url: slide2.url, alt: "HBL Our Values" },
  { url: slide3.url, alt: "Logistic Execution — port, road, sea" },
  { url: slide4.url, alt: "Containers and truck transport" },
  { url: slide5.url, alt: "Decorated freight truck on highway" },
  { url: slide6.url, alt: "HBL fleet operations" },
];

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
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

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

      {/* Right panel — slideshow */}
      <aside className="relative hidden md:block overflow-hidden">
        {slides.map((s, i) => (
          <img
            key={s.url}
            src={s.url}
            alt={s.alt}
            loading={i === 0 ? "eager" : "lazy"}
            className={
              "absolute inset-0 size-full object-contain transition-opacity duration-700 ease-in-out " +
              (i === slideIndex ? "opacity-100" : "opacity-0")
            }
          />
        ))}

        {/* Dot indicators */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-10 flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.url}
              type="button"
              onClick={() => setSlideIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={
                "h-2 rounded-full transition-all " +
                (i === slideIndex
                  ? "w-6 bg-slate-800"
                  : "w-2 bg-slate-400 hover:bg-slate-600")
              }
            />
          ))}
        </div>
      </aside>
    </main>
  );
}
