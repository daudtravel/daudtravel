import AdminPage from "@/src/components/admin/access/AdminPage";
import FinanceReportView from "@/src/components/admin/finance/FinanceReportView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "FINANCE", action: "view" }}>
      <FinanceReportView />
    </AdminPage>
  );
}
