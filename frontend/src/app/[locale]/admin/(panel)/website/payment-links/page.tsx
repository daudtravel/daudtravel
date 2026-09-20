import AdminPage from "@/src/components/admin/access/AdminPage";
import PaymentLinksListView from "@/src/components/admin/website/PaymentLinksListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <PaymentLinksListView />
    </AdminPage>
  );
}
