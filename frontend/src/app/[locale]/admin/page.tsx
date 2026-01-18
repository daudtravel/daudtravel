"use client";

import { withAuth } from "@/src/auth/isAuth";
import ClientWrapper from "./_components/ClientWrapper";

function Page() {
  return <ClientWrapper />;
}

export default withAuth(Page);
