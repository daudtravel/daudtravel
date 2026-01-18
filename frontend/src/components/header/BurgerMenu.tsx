import Link from "next/link";
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
    { href: "/products", label: t("products") },
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
              className="lg:hidden relative overflow-hidden group border border-main h-9"
            >
              <MenuIcon className="h-6 w-6 transition-transform duration-300 text-main group-hover:scale-110" />
              <span className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="border-l border-gray-200 shadow-lg"
          >
            <SheetTitle className="text-lg font-semibold pb-3 border-b border-gray-200">
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
                          ? "font-bold text-main pl-3"
                          : "font-medium hover:text-main"
                      }`}
                      prefetch={false}
                      onClick={closeSheet}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </Link>

                    {index < menuItems.length - 1 && (
                      <div className="h-px w-full bg-gray-100"></div>
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
