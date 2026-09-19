import AdminPage from "@/src/components/admin/access/AdminPage";
import CreateVideo from "@/src/app/[locale]/admin/_components/video/create-video/CreateVideo";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "create" }}>
      <CreateVideo />
    </AdminPage>
  );
}
