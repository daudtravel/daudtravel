import AdminPage from "@/src/components/admin/access/AdminPage";
import CatalogListView from "@/src/components/admin/catalog/CatalogListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "CATALOG", action: "view" }}>
      <CatalogListView />
    </AdminPage>
  );
}
