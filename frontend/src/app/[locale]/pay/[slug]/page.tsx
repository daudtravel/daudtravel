import { notFound } from "next/navigation";
import { Metadata } from "next";
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
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/quick-payment/links/${slug}?locale=${locale || "ka"}`
    );

    if (!response.ok) {
      return null;
    }

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

  const product = await getProduct(slug, locale);

  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("meta");

  const title = product?.name ?? t("default");

  const description = product?.description
    ? product.description
    : product?.name
      ? `${product.name} - ₾${product.price.toFixed(2)}`
      : t("descriptionMain");

  const image = product?.image
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`
    : "/images/MainOG.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: `https://www.daudtravel.com/${locale}/pay/${slug}`,
      siteName: "Daud Travel",
      images: [image],
    },
  };
}

export default async function PaymentPage({ params }: PageProps) {
  const { slug, locale } = await params;

  const product = await getProduct(slug, locale);

  if (!product) {
    notFound();
  }

  return <QuickPaymentPage product={product} locale={locale} slug={slug} />;
}
