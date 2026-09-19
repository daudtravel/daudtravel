import AdminPage from "@/src/components/admin/access/AdminPage";
import { ToursList } from "@/src/app/[locale]/admin/_components/tours/tour-list/ToursList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <ToursList />
    </AdminPage>
  );
}
