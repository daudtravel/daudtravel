import AdminPage from "@/src/components/admin/access/AdminPage";
import { CreateQuickLink } from "@/src/app/[locale]/admin/_components/quick-payment/CreateQuickPaymentLink";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "create" }}>
      <CreateQuickLink />
    </AdminPage>
  );
}
