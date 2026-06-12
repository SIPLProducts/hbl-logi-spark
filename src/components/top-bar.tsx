import { LogOut, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const navigate = useNavigate();
  const handleProfile = () => toast.info("Profile coming soon");
  const handleLogout = () => {
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <header className="h-12 bg-surface/90 backdrop-blur border-b border-hairline flex items-center justify-end px-4 sticky top-0 z-20 gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-muted text-foreground transition-colors">
          <span className="grid place-items-center size-7 rounded-md bg-gradient-to-br from-accent to-primary text-white text-[11px] font-display font-bold">
            AD
          </span>
          <span className="hidden md:inline text-[12px] font-medium leading-none">Admin</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-semibold">Admin User</span>
            <span className="text-[11px] font-normal text-muted-foreground">admin@hbl.com</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
            <User className="size-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-hairline bg-surface text-[12px] font-semibold text-foreground hover:bg-muted transition-colors"
        aria-label="Logout"
      >
        <LogOut className="size-3.5" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
  );
}
