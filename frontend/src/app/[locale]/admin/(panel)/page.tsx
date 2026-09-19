import AdminPage from "@/src/components/admin/access/AdminPage";
import Dashboard from "./Dashboard";

export default function DashboardPage() {
  return (
    <AdminPage requires="authenticated">
      <Dashboard />
    </AdminPage>
  );
}
