import AdminPage from "@/src/components/admin/access/AdminPage";
import HotelsListView from "@/src/components/admin/hotels/HotelsListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "HOTELS", action: "view" }}>
      <HotelsListView />
    </AdminPage>
  );
}
