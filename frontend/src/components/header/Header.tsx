"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/src/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";

import LocaleSwitcher from "@/src/i18n/LocaleSwitcher";
import BurgerMenu from "./BurgerMenu";
import { useParams, usePathname } from "next/navigation";

export default function Header() {
  const t = useTranslations("header");
  const pathname = usePathname();
  const { locale } = useParams();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (
      href === "/" &&
      (pathname === `/${locale}` || pathname === `/${locale}/`)
    ) {
      return true;
    }
    return (
      pathname === `/${locale}${href}` || pathname === `/${locale}${href}/`
    );
  };

  const isServiceActive = () => {
    return ["/tours", "/transfers", "/accommodations", "/insurance", "/products"].some(
      (path) => isActive(path)
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsServicesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="top-0 w-full bg-white shadow-md z-50">
      <div className="flex w-full items-center justify-between px-4 md:px-20 h-20">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/Logo.png"
            alt="Daud Travel"
            width={220}
            height={78}
            className="object-contain h-[4.5rem] w-auto"
            priority
          />
        </Link>

        <nav className="lg:flex items-center gap-3 md:gap-4 hidden">
          <Link href="/">
            <span
              className={`relative tracking-widest text-base font-bold text-brand-green leading-none group cursor-pointer px-4 py-2`}
            >
              {t("main")}
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-brand-green transition-transform duration-300 ease-in-out ${
                  isActive("/") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </span>
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              onMouseEnter={() => setIsServicesOpen(true)}
              aria-expanded={isServicesOpen}
              aria-haspopup="menu"
              className="relative tracking-widest text-base font-bold text-brand-green leading-none group cursor-pointer px-4 py-2 flex items-center gap-1"
            >
              {t("services") || "Services"}
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isServicesOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                  className="stroke-brand-green"
                />
              </svg>
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-brand-green transition-transform duration-300 ease-in-out ${
                  isServiceActive() ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </button>

            {isServicesOpen && (
              <div
                className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg py-2 min-w-[200px] z-50 border border-brand-green-100"
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                {[
                  { href: "/tours", label: t("tours") },
                  { href: "/transfers", label: t("transfers") },
                  { href: "/accommodations", label: t("accommodations") },
                  { href: "/insurance", label: t("insurance") },
                  { href: "/products", label: t("products") },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`px-6 py-3 hover:bg-brand-green-50 transition-colors duration-200 ${
                        isActive(item.href) ? "bg-brand-green-50" : ""
                      }`}
                    >
                      <span className={`text-base font-semibold ${isActive(item.href) ? "text-brand-green" : "text-brand-green-mid"}`}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {[
            { href: "/gallery", label: t("gallery") },
            { href: "/about", label: t("about") },
            { href: "/contact", label: t("contact") },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`relative tracking-widest text-base font-bold text-brand-green leading-none group cursor-pointer px-4 py-2`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-brand-green transition-transform duration-300 ease-in-out ${
                    isActive(item.href)
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </span>
            </Link>
          ))}

          <LocaleSwitcher />
        </nav>
        <BurgerMenu />
      </div>
    </header>
  );
}
