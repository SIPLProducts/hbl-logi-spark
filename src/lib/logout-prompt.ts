import Swal from "sweetalert2";

/**
 * Popups shown when the user clicks Logout (same as the IML project):
 * 1. "Select Action": Change Password / Logout / Cancel
 * 2. On Logout: "Are you sure want to Logout" before actually logging out
 */
export async function showLogoutPrompt({
  onChangePassword,
  onLogout,
}: {
  onChangePassword: () => void;
  onLogout: () => void;
}) {
  const action = await Swal.fire({
    title: "Select Action",
    icon: "question",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Change Password",
    denyButtonText: "Logout",
    cancelButtonText: "Cancel",
  });

  if (action.isConfirmed) {
    onChangePassword();
    return;
  }

  if (!action.isDenied) return; // Cancel

  const confirmation = await Swal.fire({
    title: "Are you sure want to Logout",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "LOGOUT",
  });

  if (confirmation.isConfirmed) {
    onLogout();
  }
}
