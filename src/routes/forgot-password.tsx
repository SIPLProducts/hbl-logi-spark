import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Send } from "lucide-react";
import Swal from "sweetalert2";
import { z } from "zod";
import {
  AuthField,
  AuthPageLayout,
  authLinkClass,
  authSubmitButtonClass,
} from "@/components/auth-page-layout";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const emailSchema = z
  .string()
  .trim()
  .min(1, "Please enter your email")
  .email("Please enter a valid email address");

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(undefined);

    // TODO(API): send the reset mail here. No mail is sent yet.
    Swal.fire({ icon: "info", text: "Forgot Password API is not connected yet." });
  };

  return (
    <AuthPageLayout
      title="Forgot your password?"
      description="Enter your registered email address and we will send you a link to reset your password."
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <AuthField
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          value={email}
          onChange={setEmail}
          error={error}
          placeholder="Enter your email"
          autoComplete="email"
        />

        <button type="submit" className={authSubmitButtonClass}>
          Send Reset Link <Send className="size-4" />
        </button>

        <div className="text-center">
          <Link to="/login" className={authLinkClass}>
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthPageLayout>
  );
}
