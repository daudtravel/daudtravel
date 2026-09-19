"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Guard from "./Guard";
import type { AccessRequirement } from "./usePermissions";

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
    </div>
  );
}

/**
 * Wraps every admin route: permission check + Suspense boundary (needed for
 * components that read search params).
 */
export default function AdminPage({
  requires,
  children,
}: {
  requires: AccessRequirement;
  children: React.ReactNode;
}) {
  return (
    <Guard requires={requires}>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </Guard>
  );
}
