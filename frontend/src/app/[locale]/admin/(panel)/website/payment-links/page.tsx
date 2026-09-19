import AdminPage from "@/src/components/admin/access/AdminPage";
import { QuickLinksList } from "@/src/app/[locale]/admin/_components/quick-payment/QuickPaymentList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <QuickLinksList />
    </AdminPage>
  );
}
