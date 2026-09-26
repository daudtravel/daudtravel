import AdminPage from "@/src/components/admin/access/AdminPage";
import HotelDetailView from "@/src/components/admin/hotels/HotelDetailView";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires={{ module: "HOTELS", action: "view" }}>
      <HotelDetailView id={id} />
    </AdminPage>
  );
}
