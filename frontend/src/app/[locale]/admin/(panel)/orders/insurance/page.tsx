import AdminPage from "@/src/components/admin/access/AdminPage";
import InsuranceSubmissionsList from "@/src/app/[locale]/admin/_components/insurance/InsuranceSubmissionList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <InsuranceSubmissionsList />
    </AdminPage>
  );
}
