import AdminPage from "@/src/components/admin/access/AdminPage";
import { EditTour } from "@/src/app/[locale]/admin/_components/tours/edit-tour/EditTour";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "edit" }}>
      <EditTour id={id} />
    </AdminPage>
  );
}
