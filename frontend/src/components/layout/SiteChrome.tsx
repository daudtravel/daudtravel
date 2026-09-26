"use client";

import { useSelectedLayoutSegment } from "next/navigation";

/**
 * Renders the public website chrome (header, footer, social bar, consent
 * banner, chat widget) everywhere except the admin panel, which has its own
 * layout. The chrome parts are passed in as already-rendered nodes so they keep
 * working as server or client components.
 */
export default function SiteChrome({
  header,
  footer,
  extras,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  extras: React.ReactNode;
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();

  if (segment === "admin") {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      {children}
      {footer}
      {extras}
    </>
  );
}
