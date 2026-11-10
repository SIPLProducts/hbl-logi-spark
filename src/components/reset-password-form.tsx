import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { KeyRound, Lock, User } from "lucide-react";
import Swal from "sweetalert2";
import {
  AuthField,
  AuthPageLayout,
  authLinkClass,
  authSubmitButtonClass,
} from "@/components/auth-page-layout";

type FormErrors = {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

/**
 * Shared by both password screens:
 * - Opened from the mail link (linkUser is set): only the new password is asked for.
 * - Opened directly (Change Password): the current password is asked for as well.
 */
export function ResetPasswordForm({ linkUser }: { linkUser?: string }) {
  const isEmailResetFlow = !!linkUser;

  const [username, setUsername] = useState(linkUser ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // A logged-in user is changing their own password, so fill in and lock their user name.
  useEffect(() => {
    const hasActiveSession =
      localStorage.getItem("isLoggedIn") === "true" &&
      sessionStorage.getItem("sessionActive") === "true";
    setIsLoggedIn(hasActiveSession);
    if (!hasActiveSession || isEmailResetFlow) return;

    try {
      const loggedInUser = JSON.parse(localStorage.getItem("userData") ?? "null")?.USER;
      if (loggedInUser) setUsername(String(loggedInUser));
    } catch {
      // Unreadable user data: the user can still type their user name
    }
  }, [isEmailResetFlow]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!username.trim()) next.username = "Please enter your user name";

    if (!isEmailResetFlow && !currentPassword) {
      next.currentPassword = "Please enter your current password";
    }

    if (!newPassword) {
      next.newPassword = "Please enter a new password";
    } else if (newPassword.length < 8) {
      next.newPassword = "New password must be at least 8 characters";
    } else if (currentPassword && newPassword === currentPassword) {
      next.newPassword = "New password must be different from the current password";
    }

    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }

    return next;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TODO(API): save the new password here. The password is not changed yet.
    Swal.fire({ icon: "info", text: "Change Password API is not connected yet." });
  };

  return (
    <AuthPageLayout
      title={isEmailResetFlow ? "Reset your password" : "Change your password"}
      description="Your new password must be at least 8 characters long."
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <AuthField
          id="username"
          label="User Name"
          icon={User}
          value={username}
          onChange={setUsername}
          error={errors.username}
          placeholder="Enter User Name"
          autoComplete="username"
          readOnly={isEmailResetFlow || (isLoggedIn && !!username)}
        />

        {!isEmailResetFlow && (
          <AuthField
            id="current-password"
            label="Current Password"
            icon={Lock}
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={errors.currentPassword}
            placeholder="Enter current password"
            autoComplete="current-password"
          />
        )}

        <AuthField
          id="new-password"
          label="New Password"
          icon={KeyRound}
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          error={errors.newPassword}
          placeholder="Enter new password"
          autoComplete="new-password"
        />

        <AuthField
          id="confirm-password"
          label="Confirm New Password"
          icon={KeyRound}
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />

        <button type="submit" className={authSubmitButtonClass}>
          {isEmailResetFlow ? "Reset Password" : "Change Password"}
        </button>

        <div className="text-center">
          <Link to={isLoggedIn ? "/" : "/login"} className={authLinkClass}>
            {isLoggedIn ? "Back to Application" : "Back to Sign In"}
          </Link>
        </div>
      </form>
    </AuthPageLayout>
  );
}
