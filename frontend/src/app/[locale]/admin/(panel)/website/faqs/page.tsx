import AdminPage from "@/src/components/admin/access/AdminPage";
import FaqList from "@/src/app/[locale]/admin/_components/faq/faq-list/FaqList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <FaqList />
    </AdminPage>
  );
}
