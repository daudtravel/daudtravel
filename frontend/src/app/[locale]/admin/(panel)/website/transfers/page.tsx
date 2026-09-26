import AdminPage from "@/src/components/admin/access/AdminPage";
import TransfersListView from "@/src/components/admin/website/TransfersListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <TransfersListView />
    </AdminPage>
  );
}
