import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, Loader2, User, Lock } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import Swal from "sweetalert2";
// @ts-ignore
import service from "../services/generalservice_service.js";
import hblLogo from "@/assets/hbl-logo.png";
import slide1 from "@/assets/loginbgimage 1.png";
import slide2 from "@/assets/loginbgimage 2.jpeg";
import slide3 from "@/assets/loginggimage 3.png";
import slide4 from "@/assets/loginbgimage 4.jpg";
import slide5 from "@/assets/loginbgimage 5.jpg";
import slide6 from "@/assets/Le1 image 6.png";

const slides = [
  { url: slide1, alt: "Slide 1" },
  { url: slide2, alt: "Slide 2" },
  { url: slide3, alt: "Slide 3" },
  { url: slide4, alt: "Slide 4" },
  { url: slide5, alt: "Slide 5" },
  { url: slide6, alt: "Slide 6" },
];

export const Route = createFileRoute("/login")({
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
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const onSubmit = async (e: FormEvent) => {
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

    try {
      const loginPayload = {
        LOGIN: {
          USER: username,
          PASSWORD: password,
          ZSESSION: "",
        },
      };

      const response = await service.GlobalUserAuth(loginPayload);

      if (response && (response.STATUS === "INACTIVE" || response.ZEXPIRY === "X")) {
        Swal.fire({
          icon: "warning",
          title: "Login Failed",
          text: response.WARNMSG,
        });
        return;
      }

      const isSuccessfulLogin =
        !!response &&
        response.STATUS !== "FALSE" &&
        !!response.USER;

      if (!isSuccessfulLogin) {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: response?.MESSAGE || "Invalid username or password",
          // footer: response?.NUMBER ? `Error Code: ${response.NUMBER}` : "",
        });
        return;
      }

      localStorage.setItem("userData", JSON.stringify(response));
      localStorage.setItem("isLoggedIn", "true");

      await Swal.fire({
        icon: "success",
        title: response?.MESSAGE || "Login Successful",
        text: `Welcome ${response?.FIRST_NAME ?? ""} ${response?.LAST_NAME ?? ""}`,
        timer: 1500,
        showConfirmButton: false,
      });

      // navigate({ to: "/" });
      const activities = response?.ACTIVITIES ?? response?.ACTIVITY ?? [];

      const normalizeKey = (input: string) =>
        input
          .toLowerCase()
          .replace(/outward/g, "")
          .replace(/[^a-z0-9]/g, "");

      const screenMap: Record<string, string> = {
        dashboard: "/",
        dispatchorders: "/dispatch-orders",
        dispatch: "/dispatch",
        orderinfo: "/order-info",
        gateinout: "/gate-in-out-process",
        invoiceloaddetails: "/invoice-load-details",
        vehicleinfo: "/vehicle-info",
        shipmentdetails: "/shipment-details",
        segmentinfo: "/segment-info",
        transitinfo: "/transit-info",
        freightbilling: "/freight-billing",
        servicelevel: "/service-level",
        transitdamageinfo: "/transit-damage-info",
        insuranceclaimtracking: "/insurance-claim-tracking",
        usercreation: "/user-creation",
      };

      const firstActivity = activities.find(
        (item: any) => item?.ACTIVITY || item?.ACT
      );

      const activityName =
        firstActivity?.ACTIVITY ?? firstActivity?.ACT ?? "";

      const firstScreen = screenMap[normalizeKey(activityName)];

      navigate({
        to: firstScreen || "/",
      });

    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: err?.message || "Something went wrong. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="h-screen w-full overflow-hidden grid md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] bg-slate-50">
      {/* Left panel — form */}
      <section className="h-full min-h-0 relative overflow-hidden bg-white">
        {/* Decorative accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-gradient-to-br from-accent/15 to-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-3xl"
        />

        {/* Watermark */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -bottom-10 -left-3 font-display font-extrabold text-[140px] leading-none tracking-tight text-slate-900/[0.035]"
        >
          HBL
        </span>

        <div className="relative min-h-full flex flex-col justify-center px-8 sm:px-14 py-6">
          <div className="max-w-sm w-full mx-auto animate-in fade-in slide-in-from-left-3 duration-700">
            <img
              src={hblLogo}
              alt="HBL Power Systems"
              className="h-14 w-auto object-contain mb-3"
            />

            <span className="font-display text-[32px] sm:text-[36px] font-extrabold leading-none tracking-tight bg-gradient-primary bg-clip-text text-transparent">
              Pravah
            </span>
            <p className="mt-2 text-[13px] text-slate-500">
              Simplifying Logistics. Empowering Operations.
            </p>
            <span className="mt-3 h-[3px] w-10 rounded-full bg-gradient-to-r from-accent to-primary" />

            <h1 className="mt-5 font-display text-[21px] font-bold leading-tight tracking-tight text-slate-900">
              Sign in to your account
            </h1>

            <form className="mt-5 space-y-3.5" onSubmit={onSubmit} noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="block text-[12px] font-semibold uppercase tracking-wide text-slate-700"
                >
                  User Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
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
                      "w-full h-10 pl-10 pr-3.5 rounded-xl border bg-slate-50/70 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all " +
                      (errors.username
                        ? "border-destructive focus:border-destructive"
                        : "border-slate-200 hover:border-slate-300 focus:border-primary")
                    }
                  />
                </div>
                {errors.username && (
                  <p className="text-[11.5px] text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[12px] font-semibold uppercase tracking-wide text-slate-700"
                >
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
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
                      "w-full h-10 pl-10 pr-11 rounded-xl border bg-slate-50/70 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all " +
                      (errors.password
                        ? "border-destructive focus:border-destructive"
                        : "border-slate-200 hover:border-slate-300 focus:border-primary")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 grid place-items-center px-3 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11.5px] text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 text-[12.5px] text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-3.5 rounded border-slate-300 accent-primary focus:ring-primary/30 cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => toast.info("Please contact your administrator")}
                  className="text-[12.5px] font-medium text-primary hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-primary text-white text-[13.5px] font-semibold shadow-cta hover:shadow-lg hover:-translate-y-px active:translate-y-0 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
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
            </form>
          </div>

          <div className="max-w-sm w-full mx-auto pt-5">
            <p className="text-[11px] text-slate-400 text-center sm:text-left">
              © {new Date().getFullYear()} Sharvi Infotech. All Rights Reserved.
            </p>
          </div>
        </div>
      </section>

      {/* Right panel — slideshow */}
      <aside className="relative hidden md:block overflow-hidden bg-slate-100">
        <div className="absolute inset-6">
          {slides.map((s, i) => (
            <img
              key={s.url}
              src={s.url}
              alt={s.alt}
              loading={i === 0 ? "eager" : "lazy"}
              className={
                "absolute inset-0 size-full object-contain object-center transition-opacity duration-700 ease-in-out " +
                (i === slideIndex ? "opacity-100" : "opacity-0")
              }
            />
          ))}
        </div>

        {/* Bottom scrim for dot legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />

        {/* Dot indicators */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-10 flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.url}
              type="button"
              onClick={() => setSlideIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={
                "h-2 rounded-full shadow-sm transition-all " +
                (i === slideIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-slate-400/80 hover:bg-slate-600")
              }
            />
          ))}
        </div>
      </aside>
    </main>
  );
}