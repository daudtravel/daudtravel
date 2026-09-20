import AdminPage from "@/src/components/admin/access/AdminPage";
import VideoFormView from "@/src/components/admin/website/VideoFormView";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "edit" }}>
      <VideoFormView id={id} />
    </AdminPage>
  );
}
