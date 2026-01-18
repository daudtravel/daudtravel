import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import {
  Arabian,
  English,
  Georgian,
  Russian,
  Turkey,
} from "@/src/components/svg";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { locales } from "./routing";

type Locale = "en" | "ka" | "ru" | "ar" | "tr";

const LanguageFlags: Record<Locale, () => JSX.Element> = {
  en: () => <English className="h-6 w-6" />,
  ka: () => <Georgian className="h-6 w-6" />,
  ru: () => <Russian className="h-6 w-6" />,
  ar: () => <Arabian className="h-6 w-6" />,
  tr: () => <Turkey className="h-6 w-6" />,
};

const languageNames: Record<Locale, string> = {
  en: "English",
  ka: "ქართული",
  ru: "Русский",
  ar: "عربي",
  tr: "Türkçe",
};

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    const pathWithoutLocale = pathname.replace(
      new RegExp(`^/${currentLocale}`),
      ""
    );
    const searchParams = new URLSearchParams(window.location.search).toString();
    const queryString = searchParams ? `?${searchParams}` : "";
    const newPath = `/${newLocale}${pathWithoutLocale}${queryString}`;

    router.push(newPath);
    router.refresh();
  };

  const CurrentFlag = LanguageFlags[currentLocale];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-full h-9 px-3 py-3 bg-white text-black border border-input hover:bg-gray-50  hover:text-accent-foreground">
          <CurrentFlag />
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="grid gap-1">
          {(locales as unknown as Locale[]).map((locale) => {
            const Flag = LanguageFlags[locale];
            return (
              <Button
                key={locale}
                variant="ghost"
                className="justify-start gap-2 w-full"
                onClick={() => handleLocaleChange(locale)}
                disabled={locale === currentLocale}
              >
                <Flag />
                <span>{languageNames[locale]}</span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
