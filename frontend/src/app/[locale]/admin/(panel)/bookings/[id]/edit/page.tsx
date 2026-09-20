import AdminPage from "@/src/components/admin/access/AdminPage";
import BookingFormView from "@/src/components/admin/bookings/BookingFormView";

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
        action: "edit",
      }}
    >
      <BookingFormView id={id} />
    </AdminPage>
  );
}
