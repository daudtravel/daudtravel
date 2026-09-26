import AdminPage from "@/src/components/admin/access/AdminPage";
import TransactionsListView from "@/src/components/admin/transactions/TransactionsListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "TRANSACTIONS", action: "view" }}>
      <TransactionsListView />
    </AdminPage>
  );
}
