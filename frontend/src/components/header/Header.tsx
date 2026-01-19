"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
    return ["/tours", "/transfers", "/insurance", "/products"].some((path) =>
      isActive(path)
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
    <header className="top-0 w-full bg-[#f2f5ff] shadow-md z-50">
      <div className="flex w-full items-center justify-between px-4 md:px-20 h-20">
        <Link href="/" className="w-[400px] md:w-[300px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300">
            <defs>
              <linearGradient id="titleGradient" x1="0%" y1="0%">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="50%" stopColor="#FF8E53" />
                <stop offset="100%" style={{ stopColor: "#FFA41B" }} />
              </linearGradient>
            </defs>

            <text
              x="600"
              y="180"
              textAnchor="middle"
              fontFamily="Arial"
              fontWeight="900"
              fontSize="120"
              fill="url(#titleGradient)"
              letterSpacing="35"
            >
              DAUD
            </text>

            <text
              x="600"
              y="235"
              textAnchor="middle"
              fontFamily="Arial"
              fontWeight="bold"
              fontSize="42"
              letterSpacing="25"
            >
              <tspan fill="#FF6B6B">T</tspan>
              <tspan fill="#FF8E53">R</tspan>
              <tspan fill="#FF8E53">A</tspan>
              <tspan fill="#FF8E53">V</tspan>
              <tspan fill="#FFA41B">E</tspan>
              <tspan fill="#FFA41B">L</tspan>
            </text>

            <path
              d="M350 250 C525 235, 675 235, 850 250"
              stroke="url(#titleGradient)"
              strokeWidth="4"
              fill="none"
            />
          </svg>
        </Link>
        <nav className="lg:flex items-center gap-3 md:gap-4 items-center hidden">
          <Link href="/">
            <span
              className={`relative tracking-widest text-lg font-bold bg-main bg-clip-text text-transparent drop-shadow-md leading-none group cursor-pointer px-4 py-2`}
            >
              {t("main")}
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFA41B] transition-transform duration-300 ease-in-out ${
                  isActive("/")
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                } before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-full before:h-0.5 before:bg-gradient-to-r before:from-[#FF6B6B] before:via-[#FF8E53] before:to-[#FFA41B] before:transition-transform before:duration-300 before:ease-in-out`}
              />
              <span className="absolute top-0 left-0 w-full h-full bg-white/10 rounded-lg transform scale-y-0 transition-transform duration-300 ease-in-out group-hover:scale-y-100 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-white/10 after:rounded-lg after:transition-transform after:duration-300 after:ease-in-out" />
            </span>
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              onMouseEnter={() => setIsServicesOpen(true)}
              className="relative tracking-widest text-lg font-bold bg-main bg-clip-text text-transparent drop-shadow-md leading-none group cursor-pointer px-4 py-2 flex items-center gap-1"
            >
              {t("services") || "Services"}
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${
                  isServicesOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                  className="stroke-[#FF6B6B]"
                />
              </svg>
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFA41B] transition-transform duration-300 ease-in-out ${
                  isServiceActive()
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
              <span className="absolute top-0 left-0 w-full h-full bg-white/10 rounded-lg transform scale-y-0 transition-transform duration-300 ease-in-out group-hover:scale-y-100" />
            </button>

            {isServicesOpen && (
              <div
                className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg py-2 min-w-[200px] z-50"
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                {[
                  { href: "/tours", label: t("tours") },
                  { href: "/transfers", label: t("transfers") },
                  { href: "/insurance", label: t("insurance") },
                  { href: "/products", label: t("products") },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`px-6 py-3 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:via-[#FF8E53]/10 hover:to-[#FFA41B]/10 transition-colors duration-200 ${
                        isActive(item.href) ? "bg-[#FFA41B]/10" : ""
                      }`}
                    >
                      <span className="text-lg font-semibold bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFA41B] bg-clip-text text-transparent">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {[
            { href: "/about", label: t("about") },
            { href: "/contact", label: t("contact") },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`relative tracking-widest text-lg font-bold bg-main bg-clip-text text-transparent drop-shadow-md leading-none group cursor-pointer px-4 py-2`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFA41B] transition-transform duration-300 ease-in-out ${
                    isActive(item.href)
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  } before:content-[''] before:absolute before:bottom-0 before:left-0 before:w-full before:h-0.5 before:bg-gradient-to-r before:from-[#FF6B6B] before:via-[#FF8E53] before:to-[#FFA41B] before:transition-transform before:duration-300 before:ease-in-out`}
                />
                <span className="absolute top-0 left-0 w-full h-full bg-white/10 rounded-lg transform scale-y-0 transition-transform duration-300 ease-in-out group-hover:scale-y-100 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-white/10 after:rounded-lg after:transition-transform after:duration-300 after:ease-in-out" />
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
