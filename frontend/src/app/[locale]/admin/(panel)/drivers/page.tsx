import AdminPage from "@/src/components/admin/access/AdminPage";
import { DriversList } from "@/src/app/[locale]/admin/_components/drivers/driver-list/DriversList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "DRIVERS", action: "view" }}>
      <DriversList />
    </AdminPage>
  );
}
