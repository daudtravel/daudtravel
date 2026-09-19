import AdminPage from "@/src/components/admin/access/AdminPage";
import { AccommodationsList } from "@/src/app/[locale]/admin/_components/accommodations/accommodation-list/AccommodationsList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <AccommodationsList />
    </AdminPage>
  );
}
