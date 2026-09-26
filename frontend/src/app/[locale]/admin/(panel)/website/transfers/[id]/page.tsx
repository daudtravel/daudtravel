import AdminPage from "@/src/components/admin/access/AdminPage";
import EditTransfer from "@/src/app/[locale]/admin/_components/transfers/edit-transfer/EditTransfer";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "edit" }}>
      <EditTransfer params={{ id }} />
    </AdminPage>
  );
}
