import AdminPage from "@/src/components/admin/access/AdminPage";
import VideoFormView from "@/src/components/admin/website/VideoFormView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "create" }}>
      <VideoFormView />
    </AdminPage>
  );
}
