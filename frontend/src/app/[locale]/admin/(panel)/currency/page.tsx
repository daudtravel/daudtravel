import AdminPage from "@/src/components/admin/access/AdminPage";
import CurrencyView from "@/src/components/admin/currency/CurrencyView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "CURRENCY", action: "view" }}>
      <CurrencyView />
    </AdminPage>
  );
}
