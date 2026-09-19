import AdminPage from "@/src/components/admin/access/AdminPage";
import { TransfersList } from "@/src/app/[locale]/admin/_components/transfers/transfer-list/TransfersList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <TransfersList />
    </AdminPage>
  );
}
