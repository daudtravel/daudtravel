import { Link } from "@/src/i18n/routing";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { usePathname, useParams, useSearchParams } from "next/navigation";
import LocaleSwitcher from "@/src/i18n/LocaleSwitcher";

export default function BurgerMenu() {
  const t = useTranslations("header");
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useParams();
  const searchParams = useSearchParams();
  const closeSheet = () => setIsOpen(false);

  const menuItems = [
    { href: "/", label: t("main") },
    { href: "/tours?type=INDIVIDUAL", label: t("individualTourType") },
    { href: "/tours?type=GROUP", label: t("groupTourType") },
    { href: "/transfers", label: t("transfers") },
    { href: "/accommodations", label: t("accommodations") },
    { href: "/insurance", label: t("insurance") },
    { href: "/products", label: t("products") },
    { href: "/gallery", label: t("gallery") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  const isActive = (href: string) => {
    if (
      href === "/" &&
      (pathname === `/${locale}` || pathname === `/${locale}/`)
    ) {
      return true;
    }

    const [basePath, queryString] = href.split("?");

    if (basePath === "/tours" && queryString) {
      if (!pathname.startsWith(`/${locale}/tours`)) {
        return false;
      }
      const isGroupParam = new URLSearchParams(queryString).get("type");
      const currentIsGroup = searchParams.get("type");
      return isGroupParam === currentIsGroup;
    }

    return (
      pathname === `/${locale}${basePath}` ||
      pathname === `/${locale}${basePath}/`
    );
  };

  return (
    <header className="w-full flex lg:hidden items-center">
      <div className="ml-auto flex items-center space-x-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <LocaleSwitcher />
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden relative overflow-hidden group border border-brand-green-100 bg-white hover:bg-brand-green-50 h-9 text-brand-green hover:text-brand-green"
            >
              <MenuIcon className="h-6 w-6 text-brand-green" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="border-l border-brand-green-100 shadow-lg bg-brand-green"
          >
            <SheetTitle className="text-lg font-semibold pb-3 border-b border-brand-green-mid text-brand-yellow">
              {t("daudTravel")}
            </SheetTitle>

            <nav className="flex flex-col">
              {menuItems.map((item, index) => {
                const active = isActive(item.href);
                return (
                  <div key={item.href} className="flex flex-col">
                    <Link
                      href={item.href}
                      className={`text-sm py-4 px-1 transition-all duration-300 hover:pl-3 relative group ${
                        active
                          ? "font-bold text-brand-yellow pl-3"
                          : "font-medium text-brand-cream hover:text-brand-yellow"
                      }`}
                      prefetch={false}
                      onClick={closeSheet}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </Link>

                    {index < menuItems.length - 1 && (
                      <div className="h-px w-full bg-brand-green-mid/50"></div>
                    )}
                  </div>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
