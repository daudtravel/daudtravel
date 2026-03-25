import TourDetails from "./_components/TourDetails";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

async function getTour(id: string, locale: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tours/${id}?locale=${locale}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const tour = await getTour(id, locale);

  if (!tour) {
    return {
      title: "Tour Not Found",
      description: "The requested tour could not be found.",
    };
  }

  const tourData = tour.data ?? tour;
  const localization = tourData.localizations?.[0];

  const title = localization?.name?.trim() ?? "Tour Details";

  let description = "Explore this amazing tour.";
  if (localization?.description) {
    try {
      const parsed = JSON.parse(localization.description);
      const plainText = parsed.blocks
        ?.map((block: { text: string }) => block.text)
        .join(" ")
        .trim()
        .slice(0, 160);
      if (plainText) description = plainText;
    } catch {
      description = localization.description.slice(0, 160);
    }
  }

  const imagePath = tourData.mainImage ?? tourData.images?.[0];
  const image = imagePath
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${imagePath}`
    : null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: title }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function Page() {
  return <TourDetails />;
}
