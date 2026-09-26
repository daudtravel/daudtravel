import AdminPage from "@/src/components/admin/access/AdminPage";
import VideosListView from "@/src/components/admin/website/VideosListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <VideosListView />
    </AdminPage>
  );
}
