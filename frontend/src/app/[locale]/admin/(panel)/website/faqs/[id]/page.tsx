import AdminPage from "@/src/components/admin/access/AdminPage";
import EditFaq from "@/src/app/[locale]/admin/_components/faq/edit-faq/EditFaq";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "edit" }}>
      <EditFaq params={{ id }} />
    </AdminPage>
  );
}
