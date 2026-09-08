import { adminSignOut } from "@/auth-admin";
import { Button } from "@/components/ui/button";

export function AdminSignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await adminSignOut({ redirectTo: "/admin/login" });
      }}
    >
      <Button type="submit" variant="outline" className="w-full">
        Çıkış Yap
      </Button>
    </form>
  );
}
