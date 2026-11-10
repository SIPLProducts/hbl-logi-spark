import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordForm } from "@/components/reset-password-form";

// Change Password: /reset-password
export const Route = createFileRoute("/reset-password/")({
  component: () => <ResetPasswordForm />,
});
