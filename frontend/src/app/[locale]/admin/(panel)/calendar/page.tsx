import AdminPage from "@/src/components/admin/access/AdminPage";
import CalendarView from "@/src/components/admin/calendar/CalendarView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "CALENDAR", action: "view" }}>
      <CalendarView />
    </AdminPage>
  );
}
