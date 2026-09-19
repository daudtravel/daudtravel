import AdminPage from "@/src/components/admin/access/AdminPage";
import CreateDriver from "@/src/app/[locale]/admin/_components/drivers/create-driver/CreateDriver";

export default function Page() {
  return (
    <AdminPage requires={{ module: "DRIVERS", action: "create" }}>
      <CreateDriver />
    </AdminPage>
  );
}
