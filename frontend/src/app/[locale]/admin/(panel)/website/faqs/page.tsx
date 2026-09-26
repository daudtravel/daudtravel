import AdminPage from "@/src/components/admin/access/AdminPage";
import FaqListView from "@/src/components/admin/website/FaqListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <FaqListView />
    </AdminPage>
  );
}
