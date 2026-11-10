import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Eye, EyeOff, type LucideIcon } from "lucide-react";
import hblLogo from "@/assets/hbl-logo.png";
import slide1 from "@/assets/loginbgimage 1.png";
import slide2 from "@/assets/loginbgimage 2.jpeg";
import slide3 from "@/assets/loginggimage 3.png";
import slide6 from "@/assets/Le1 image 6.png";

const slides = [
  { url: slide1, alt: "Slide 1" },
  { url: slide2, alt: "Slide 2" },
  { url: slide3, alt: "Slide 3" },
  { url: slide6, alt: "Slide 6" },
];

export const authSubmitButtonClass =
  "w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4d7fb3] to-[#0b2249] text-white text-[13.5px] font-semibold shadow-[0_12px_24px_-10px_rgba(11,34,73,0.6)] hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0";

export const authLinkClass =
  "text-[12px] font-medium text-[#0b2249] hover:text-accent hover:underline cursor-pointer";

/** Same page design as the login screen: slideshow on the left, form card on the right. */
export function AuthPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="h-screen w-full overflow-hidden grid md:grid-cols-[3fr_2fr] bg-white">
      {/* Left panel: slideshow */}
      <section className="relative z-10 hidden md:flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-sky-100 via-sky-50 to-white px-8 lg:px-10 pt-8 lg:pt-10 pb-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -left-20 size-[26rem] rounded-full bg-accent/15 blur-3xl"
        />

        <div className="relative flex-1 min-h-0 flex flex-col pt-2 animate-in fade-in slide-in-from-left-3 duration-700">
          <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-18px_rgba(11,34,73,0.30)]">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              {slides.map((s, i) => (
                <img
                  key={s.url}
                  src={s.url}
                  alt={s.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full min-w-full object-contain object-center p-1"
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.url}
                type="button"
                onClick={() => setSlideIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                className={
                  "h-2 rounded-full transition-all " +
                  (i === slideIndex
                    ? "w-7 bg-[#0b2249]"
                    : "w-2 bg-slate-300 hover:bg-slate-400")
                }
              />
            ))}
          </div>
        </div>

        <div className="relative pt-4">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[12px] font-medium text-slate-700">
            {["Faster Approvals", "Better Visibility", "Smarter Logistics"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-[18px] text-accent" />
                {t}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            © {new Date().getFullYear()} Sharvi Infotech. All Rights Reserved.
          </p>
        </div>
      </section>

      {/* Right panel: form */}
      <section className="relative h-full min-h-0 overflow-hidden bg-gradient-to-br from-white via-slate-50 to-sky-100/70">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-10 h-[30rem] w-24 rotate-[40deg] rounded-full bg-gradient-to-b from-accent/15 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-10 h-[30rem] w-32 rotate-[40deg] rounded-full bg-gradient-to-b from-accent/20 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-14 h-[26rem] w-28 rotate-[40deg] rounded-full bg-gradient-to-t from-primary/10 to-transparent"
        />

        {/* Only the form scrolls, and only when the screen is too short to fit it */}
        <div className="relative flex h-full flex-col overflow-y-auto overflow-x-hidden px-6 sm:px-8 lg:px-10 py-6">
        <div className="w-full max-w-[360px] m-auto animate-in fade-in slide-in-from-right-3 duration-700">
          <div className="mb-7">
            <div className="flex items-center gap-4 lg:gap-5">
              <img
                src={hblLogo}
                alt="HBL Power Systems"
                className="h-12 lg:h-14 xl:h-16 w-auto object-contain shrink-0"
              />
              <span className="h-10 lg:h-12 xl:h-14 w-px bg-slate-300 shrink-0" aria-hidden />
              <span className="font-sans text-[32px] lg:text-[40px] xl:text-[46px] font-bold leading-none tracking-tight text-[#0b2249]">
                Pravah
              </span>
            </div>
            <p className="mt-2.5 text-[12.5px] lg:text-[13.5px] text-[#4f6f96]">
              Simplifying Logistics. Empowering Operations.
            </p>
          </div>

          <h1 className="font-display text-[28px] sm:text-[30px] font-bold leading-tight tracking-tight text-[#0b2249]">
            {title}
          </h1>
          <span className="mt-2.5 block h-[3px] w-12 rounded-full bg-accent" />
          {description && (
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">{description}</p>
          )}

          <div className="mt-6 rounded-2xl border border-white bg-white p-6 shadow-[0_24px_50px_-24px_rgba(11,34,73,0.30)]">
            {children}
          </div>

          <p className="md:hidden mt-4 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} Sharvi Infotech. All Rights Reserved.
          </p>
        </div>
        </div>
      </section>
    </main>
  );
}

/** Text or password input styled like the login screen. Password fields get a show/hide button. */
export function AuthField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  readOnly = false,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  readOnly?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[12px] font-semibold text-slate-700">
        {label} <span className="text-destructive">*</span>
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
        <input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly={readOnly}
          maxLength={100}
          aria-invalid={!!error}
          className={
            "w-full h-11 pl-10 rounded-lg border bg-[#e8f0fc] text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-accent/15 transition-all " +
            (isPassword ? "pr-11 " : "pr-3.5 ") +
            (readOnly ? "cursor-not-allowed opacity-70 " : "") +
            (error
              ? "border-destructive focus:border-destructive"
              : "border-transparent hover:border-slate-200 focus:border-accent")
          }
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 grid place-items-center px-3.5 text-slate-500 hover:text-slate-800"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-[11.5px] text-destructive">{error}</p>}
    </div>
  );
}
