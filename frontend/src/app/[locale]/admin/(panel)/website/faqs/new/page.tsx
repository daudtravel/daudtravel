import AdminPage from "@/src/components/admin/access/AdminPage";
import CreateFaq from "@/src/app/[locale]/admin/_components/faq/create-faq/CreateFaq";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "create" }}>
      <CreateFaq />
    </AdminPage>
  );
}
