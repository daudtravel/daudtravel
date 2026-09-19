import AdminPage from "@/src/components/admin/access/AdminPage";
import { InsuranceSubmissionDetails } from "@/src/app/[locale]/admin/_components/insurance/InsuranceSumbissionDetails";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <InsuranceSubmissionDetails submissionId={id} />
    </AdminPage>
  );
}
