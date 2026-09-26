import AdminPage from "@/src/components/admin/access/AdminPage";
import { EditQuickLink } from "@/src/app/[locale]/admin/_components/quick-payment/EditQuickPaymentLink";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "edit" }}>
      <EditQuickLink slug={slug} />
    </AdminPage>
  );
}
