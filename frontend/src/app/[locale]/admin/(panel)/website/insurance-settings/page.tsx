import AdminPage from "@/src/components/admin/access/AdminPage";
import InsuranceSettings from "@/src/app/[locale]/admin/_components/insurance/InsuranceSettings";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "edit" }}>
      <InsuranceSettings />
    </AdminPage>
  );
}
