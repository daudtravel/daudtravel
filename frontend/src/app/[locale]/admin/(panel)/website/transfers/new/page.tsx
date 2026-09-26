import AdminPage from "@/src/components/admin/access/AdminPage";
import CreateTransfer from "@/src/app/[locale]/admin/_components/transfers/create-transfer/CreateTransfer";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "create" }}>
      <CreateTransfer />
    </AdminPage>
  );
}
