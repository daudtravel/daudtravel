import { AdminNotFound } from "@/src/components/admin/access/Guard";

/** Unknown /admin/* URLs stay inside the admin layout. */
export default function AdminCatchAll() {
  return <AdminNotFound />;
}
