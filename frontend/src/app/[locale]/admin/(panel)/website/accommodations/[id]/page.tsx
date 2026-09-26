import AdminPage from "@/src/components/admin/access/AdminPage";
import EditAccommodation from "@/src/app/[locale]/admin/_components/accommodations/edit-accommodation/EditAccommodation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "edit" }}>
      <EditAccommodation id={id} />
    </AdminPage>
  );
}
