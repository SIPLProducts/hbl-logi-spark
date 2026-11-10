import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordForm } from "@/components/reset-password-form";

// Reset Password from the mail link: /reset-password/<username>
export const Route = createFileRoute("/reset-password/$user")({
  component: ResetPasswordFromLink,
});

function ResetPasswordFromLink() {
  const { user } = Route.useParams();
  return <ResetPasswordForm linkUser={user} />;
}
