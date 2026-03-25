import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { QuickPaymentPage } from "../_components/QuickPaymentPage";

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

interface ProductData {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  locale: string;
  availableLocales: string[];
}

async function getProduct(
  slug: string,
  locale: string
): Promise<ProductData | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/quick-payment/links/${slug}?locale=${locale || "ka"}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return null;

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations("meta");

  const product = await getProduct(slug, locale);

  const baseUrl = "https://www.daudtravel.com";
  const currentUrl = `${baseUrl}/${locale}/pay/${slug}`;

  const title = product?.name ?? t("default");

  const description = product?.description
    ? product.description
    : product?.name
      ? `${product.name} - ₾${product.price.toFixed(2)}`
      : t("descriptionMain");

  const ogImage = product?.image
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`
    : `${baseUrl}/images/MainOG.jpg`;ფ

  const availableLocales = product?.availableLocales ?? [
    "ka",
    "en",
    "ru",
    "tr",
    "ar",
  ];
  const languageAlternates = availableLocales.reduce(
    (acc, loc) => ({ ...acc, [loc]: `${baseUrl}/${loc}/pay/${slug}` }),
    {} as Record<string, string>
  );

  return {
    title,
    description,
    authors: [{ name: "Daud Travel" }],
    creator: "Daud Travel",
    publisher: "Daud Travel",

    alternates: {
      canonical: currentUrl,
      languages: languageAlternates,
    },

    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: currentUrl,
      siteName: "Daud Travel",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: product?.image ? "image/jpeg" : "image/png",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PaymentPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const product = await getProduct(slug, locale);

  if (!product) notFound();

  return <QuickPaymentPage product={product} locale={locale} slug={slug} />;
}
