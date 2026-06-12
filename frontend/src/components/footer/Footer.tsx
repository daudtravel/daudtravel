"use client";

import { Link } from "@/src/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Phone, Mail } from "lucide-react";
import {
  FacebookWhite,
  InstagramWhite,
  Youtube,
  Tiktok,
  Telegram,
} from "@/src/components/svg";

const socials = [
  {
    href: "https://www.facebook.com/share/mfSUtXxwN4HnpaQW/",
    label: "Facebook",
    Icon: FacebookWhite,
  },
  {
    href: "https://www.instagram.com/daud_travel",
    label: "Instagram",
    Icon: InstagramWhite,
  },
  {
    href: "https://youtube.com/@daud_travel",
    label: "YouTube",
    Icon: Youtube,
  },
  {
    href: "https://www.tiktok.com/@daud_travel",
    label: "TikTok",
    Icon: Tiktok,
  },
  {
    href: "https://t.me/daud_travel",
    label: "Telegram",
    Icon: Telegram,
  },
];

export default function Footer() {
  const t = useTranslations("header");
  const tContact = useTranslations("contact");

  const serviceLinks = [
    { href: "/tours", label: t("tours") },
    { href: "/transfers", label: t("transfers") },
    { href: "/accommodations", label: t("accommodations") },
    { href: "/insurance", label: t("insurance") },
    { href: "/products", label: t("products") },
  ];

  const companyLinks = [
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <footer className="w-full bg-brand-green-dark text-brand-cream">
      <div className="px-4 md:px-20 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Brand + socials */}
        <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
          <Link href="/" className="inline-flex">
            <span className="inline-flex items-center justify-center bg-brand-cream rounded-2xl px-4 py-2 shadow-md">
              <Image
                src="/images/Logo.png"
                alt="Daud Travel"
                width={160}
                height={56}
                className="object-contain h-12 w-auto"
              />
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Icon className="w-4 h-4 fill-brand-cream" />
              </a>
            ))}
          </div>
        </div>

        {/* Services + company nav */}
        <nav
          className="grid grid-cols-2 gap-6 text-center md:text-left"
          aria-label="Footer"
        >
          <div>
            <h3 className="text-sm font-bold text-brand-yellow uppercase tracking-wider mb-3">
              {t("services")}
            </h3>
            <ul className="space-y-2">
              {serviceLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-brand-cream/80 hover:text-brand-yellow transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-yellow uppercase tracking-wider mb-3">
              {t("daudTravel")}
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-brand-cream/80 hover:text-brand-yellow transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Contact info */}
        <div className="flex flex-col gap-3 items-center md:items-start">
          <h3 className="text-sm font-bold text-brand-yellow uppercase tracking-wider mb-1">
            {tContact("contactInfo")}
          </h3>
          <a
            href="tel:+995557442212"
            className="flex items-center gap-2.5 text-sm text-brand-cream/80 hover:text-brand-yellow transition-colors"
          >
            <Phone className="w-4 h-4 shrink-0" />
            +995 557 44 22 12
          </a>
          <a
            href="mailto:traveldaud@gmail.com"
            className="flex items-center gap-2.5 text-sm text-brand-cream/80 hover:text-brand-yellow transition-colors"
          >
            <Mail className="w-4 h-4 shrink-0" />
            traveldaud@gmail.com
          </a>
          <span className="flex items-center gap-2.5 text-sm text-brand-cream/80">
            <MapPin className="w-4 h-4 shrink-0" />
            St. Chabua Amirejibi #4, Batumi
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-4 md:px-20 py-4 flex flex-col md:flex-row items-center justify-center md:justify-between gap-2">
        <p className="text-xs text-brand-cream/60">
          © {new Date().getFullYear()} Daud Travel. {t("allRightsReserved")}.
        </p>
        <div className="flex items-center gap-4 text-xs text-brand-cream/60">
          <Link href="/terms" className="hover:text-brand-yellow transition-colors">
            {t("termsAndConditions")}
          </Link>
          <Link href="/privacy" className="hover:text-brand-yellow transition-colors">
            {t("privacyPolicy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
