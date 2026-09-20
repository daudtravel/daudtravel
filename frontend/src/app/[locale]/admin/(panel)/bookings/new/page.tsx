import AdminPage from "@/src/components/admin/access/AdminPage";
import BookingFormView from "@/src/components/admin/bookings/BookingFormView";

export default function Page() {
  return (
    <AdminPage
      requires={{
        anyOf: ["BOOKINGS_HOTEL", "BOOKINGS_TOUR", "BOOKINGS_PACKAGE"],
        action: "create",
      }}
    >
      <BookingFormView />
    </AdminPage>
  );
}
