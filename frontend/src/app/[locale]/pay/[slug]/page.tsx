import { QuickPaymentPage } from "../_components/QuickPaymentPage";

 

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function PayPage({ params }: PageProps) {
  const { slug, locale } = await params;
  return <QuickPaymentPage slug={slug} locale={locale} />;
}
