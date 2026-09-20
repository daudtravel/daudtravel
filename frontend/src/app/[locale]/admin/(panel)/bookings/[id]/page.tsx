import AdminPage from "@/src/components/admin/access/AdminPage";
import BookingDetailView from "@/src/components/admin/bookings/BookingDetailView";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage
      requires={{
        anyOf: ["BOOKINGS_HOTEL", "BOOKINGS_TOUR", "BOOKINGS_PACKAGE"],
        action: "view",
      }}
    >
      <BookingDetailView id={id} />
    </AdminPage>
  );
}
