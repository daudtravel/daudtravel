import AdminPage from "@/src/components/admin/access/AdminPage";
import DriverDetailView from "@/src/components/admin/drivers/DriverDetailView";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires={{ module: "DRIVERS", action: "view" }}>
      <DriverDetailView id={id} />
    </AdminPage>
  );
}
