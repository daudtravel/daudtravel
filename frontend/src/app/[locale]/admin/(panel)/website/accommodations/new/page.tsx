import AdminPage from "@/src/components/admin/access/AdminPage";
import CreateAccommodation from "@/src/app/[locale]/admin/_components/accommodations/create-accommodation/CreateAccommodation";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "create" }}>
      <CreateAccommodation />
    </AdminPage>
  );
}
