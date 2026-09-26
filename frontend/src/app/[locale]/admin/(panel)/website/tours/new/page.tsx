import AdminPage from "@/src/components/admin/access/AdminPage";
import CreateTour from "@/src/app/[locale]/admin/_components/tours/create-tour/CreateTour";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "create" }}>
      <CreateTour />
    </AdminPage>
  );
}
