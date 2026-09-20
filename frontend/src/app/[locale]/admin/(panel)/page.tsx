import AdminPage from "@/src/components/admin/access/AdminPage";
import DashboardView from "@/src/components/admin/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <AdminPage requires="authenticated">
      <DashboardView />
    </AdminPage>
  );
}
