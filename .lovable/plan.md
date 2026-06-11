## Goal
Replace the current `/user-creation` screen with a simple User Management list page plus a "Create New User" modal popup, matching the two reference screenshots.

## Changes

### 1. Rewrite `src/routes/user-creation.tsx`
Drop `LeScreenShell` entirely (the tabs / SAP toggle / "Direction" bar don't belong here). Render a standalone page:

- Wrapper card containing:
  - Header row: title "User Management" (left, indigo accent) + **"+ Create New User"** button (right, gradient indigo→purple to match the reference). Clicking opens the modal.
  - Data table with sky→teal gradient header (matching the rest of the LE app) and these columns:
    `User ID, First Name, Last Name, Email, Contact, Employee Code, In/Out, Category, Roles, Status, Plants, Divisions, Activities, Actions`.
  - One seed row: `2424 / Admin / User / inturimounika@sharviinfotech.com / 7337283880 / 2424 / outward / Internal / ADMIN / Active(green pill) / Plants (10)(pill) / Divisions (10)(pill) / 🛡 Screens (23)(pill) / edit + delete icons`.
- "Items per page: 1" footer line below the table.

- `head()` keeps title "User Creation · HBL LE".

State: `const [open, setOpen] = useState(false);` — `open` controls the modal.

### 2. New component: `src/components/create-user-dialog.tsx`
Modal popup using existing shadcn `Dialog` (`@/components/ui/dialog`). Receives `{ open, onOpenChange }` props.

- Dialog header: gradient indigo→purple bar with title **"Create New User"** + close (×).
- Body fields in a 3-column responsive grid:
  - Row 1: User ID* (prefilled `2424`), First Name*, Last Name
  - Row 2: Contact*, Email*, Category (select: Internal / External; default Internal)
  - Row 3: Password* (type=password, eye toggle icon), Confirm Password* (type=password, eye toggle icon), Employee Code*
  - Row 4: In/Out Type* (select), Plants (multi-select look — single text input "Select Plants"), Divisions ("Select Divisions")
  - Row 5: Role (select), Activities (Screens) → a blue button labelled **"Select Screens (0)"**, Status → segmented `Inactive | toggle | Active` (toggle defaults Active green)
- Footer: dark-red **Create** button right-aligned.
- Inputs styled with the existing emerald GREEN_INPUT pattern? — No, the modal in the reference uses neutral white inputs with light borders. Use plain inputs: `h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px]` with red asterisks on required labels.
- Local component state only (no submission wiring); on Create just calls `onOpenChange(false)`.

### 3. Sidebar — no change
`User Creation` entry already added; URL unchanged.

### 4. Remove `src/components/user-creation-create.tsx`
It is no longer referenced.

No backend or schema changes.
