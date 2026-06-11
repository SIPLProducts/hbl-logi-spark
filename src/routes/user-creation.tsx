import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";
import { UserCreationCreate } from "@/components/user-creation-create";

export const Route = createFileRoute("/user-creation")({
  head: () => ({
    meta: [
      { title: "User Creation · HBL LE" },
      { name: "description", content: "Create and manage HBL LE application users, roles, and permissions." },
    ],
  }),
  component: UserCreationPage,
});

function UserCreationPage() {
  return (
    <LeScreenShell
      title="User Creation"
      renderCreateBody={({ direction }) =>
        direction === "outward" ? <UserCreationCreate /> : null
      }
      groups={[
        {
          title: "User",
          fields: [
            { label: "User ID", value: "USR-0001" },
            { label: "Full Name", value: "Harshini Lingutla" },
            { label: "Email", value: "harshini@hbl.in" },
            { label: "Role", value: "LE Operator", type: "select", options: ["Admin", "LE Operator", "Approver", "Viewer"] },
            { label: "Plant", value: "HBL NCPP-SHPT", type: "select", options: ["HBL NCPP-SHPT", "HBL VSP-SHPT", "HBL HYD-PLANT-04"] },
            { label: "Status", value: "Active", type: "select", options: ["Active", "Inactive", "Suspended"] },
          ],
        },
      ]}
    />
  );
}