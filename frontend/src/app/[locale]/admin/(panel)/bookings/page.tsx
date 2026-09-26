import AdminPage from "@/src/components/admin/access/AdminPage";
import BookingsListView from "@/src/components/admin/bookings/BookingsListView";

export default function Page() {
  return (
    <AdminPage
      requires={{
        anyOf: ["BOOKINGS_HOTEL", "BOOKINGS_TOUR", "BOOKINGS_PACKAGE"],
        action: "view",
      }}
    >
      <BookingsListView />
    </AdminPage>
  );
}
