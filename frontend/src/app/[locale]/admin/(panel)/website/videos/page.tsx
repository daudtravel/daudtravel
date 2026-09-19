import AdminPage from "@/src/components/admin/access/AdminPage";
import VideoList from "@/src/app/[locale]/admin/_components/video/video-list/VideoList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <VideoList />
    </AdminPage>
  );
}
