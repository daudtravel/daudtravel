import { Metadata } from "next";
import DriverProfile from "./_components/DriverProfile";

export const metadata: Metadata = {
  title: "Driver Profile | Daud Travel",
  robots: { index: false, follow: true },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="w-full relative">
      <DriverProfile driverId={id} />
    </main>
  );
}
