"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { MapPin, Star, ArrowRight, Users, Globe, Award } from "lucide-react";

const slides = [
  { src: "/images/Svaneti.jpg", alt: "Svaneti mountains", location: "Svaneti" },
  { src: "/images/Batumi.jpg", alt: "Batumi city", location: "Batumi" },
  { src: "/images/River.jpg", alt: "Georgian river", location: "Mtkvari River" },
];

export default function CoverSection() {
  const t = useTranslations("main");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 5500);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { icon: Users, value: "1000+", label: t("happyClient") },
    { icon: Globe, value: "200+", label: t("toursCompleted") },
    { icon: MapPin, value: "10+", label: t("destinations") },
    { icon: Award, value: "5+", label: t("yearsExperience") },
  ];

  return (
    <div
      className={`relative w-full min-h-screen flex overflow-hidden ${isRTL ? "rtl" : "ltr"}`}
    >
      {/* ─── Full-screen background images ─── */}
      {slides.map((slide, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover object-center"
            priority={i === 0}
            sizes="100vw"
          />
        </motion.div>
      ))}

      {/* Mobile overlay */}
      <div className="absolute inset-0 bg-brand-green/80 z-10 lg:hidden" />

      {/* ─── Left content panel (desktop solid, mobile overlay) ─── */}
      <div
        className={`relative z-20 flex flex-col w-full lg:w-[46%] xl:w-[42%] min-h-screen bg-transparent lg:bg-brand-green px-6 sm:px-10 md:px-14 lg:px-12 xl:px-16 pt-28 pb-10 ${isRTL ? "lg:items-end" : "lg:items-start"} items-center justify-between`}
      >
        {/* Top content block */}
        <div className={`w-full ${isRTL ? "text-right" : "text-left"}`}>

          {/* ── Rating badge ── */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className={`inline-flex items-center gap-2.5 bg-white/10 border border-brand-yellow/40 rounded-full px-4 py-2 mb-10 ${isRTL ? "" : ""}`}
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
              ))}
            </div>
            <span className="text-brand-yellow text-xs font-bold tracking-wider uppercase">
              {t("findEmotions")}
            </span>
          </motion.div>

          {/* ── Main headline ── */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className={`text-center lg:text-left font-extrabold leading-[1.04] tracking-tight mb-5 ${isRTL ? "lg:text-right" : "lg:text-left"}`}
            style={{ fontSize: "clamp(2.6rem, 5.5vw, 5rem)" }}
          >
            <span className="text-white block">{t("exploreGeorgia")}</span>
            <span className="text-brand-yellow block">{t("popularDestinations")}</span>
          </motion.h1>

          {/* ── Subtitle ── */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className={`text-brand-cream/70 text-base leading-relaxed mb-10 max-w-md ${isRTL ? "lg:ml-auto" : ""} text-center lg:text-left ${isRTL ? "lg:text-right" : ""}`}
          >
            {t("trustedPart")}
          </motion.p>

          {/* ── CTA buttons ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.4 }}
            className={`flex flex-wrap gap-3 mb-10 justify-center lg:justify-start ${isRTL ? "lg:justify-end" : ""}`}
          >
            <Link href="/tours">
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-green font-bold text-sm rounded-xl transition-colors shadow-lg shadow-brand-yellow/20 cursor-pointer"
              >
                {t("exploreTours")}
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </Link>
            <Link href="/transfers">
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 hover:bg-white/10 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                {t("bookTransfer")}
              </motion.div>
            </Link>
          </motion.div>

          {/* ── Current location ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className={`flex items-center gap-2 mb-6 justify-center lg:justify-start ${isRTL ? "lg:justify-end" : ""}`}
          >
            <MapPin className="w-4 h-4 text-brand-yellow shrink-0" />
            <span className="text-brand-cream/50 text-sm">
              {t("popularDestinations")}:{" "}
              <motion.span
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-brand-cream font-semibold"
              >
                {slides[current].location}, Georgia
              </motion.span>
            </span>
          </motion.div>

          {/* ── Slide dots ── */}
          <div className={`flex items-center gap-2 justify-center lg:justify-start ${isRTL ? "lg:justify-end" : ""}`}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 h-2.5 bg-brand-yellow"
                    : "w-2.5 h-2.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── Stats bar at bottom ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="w-full pt-8 mt-10 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-y-5 gap-x-4"
        >
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className={`flex flex-col items-center lg:items-start ${isRTL ? "lg:items-end" : ""}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className="w-3.5 h-3.5 text-brand-yellow" />
                <span className="text-brand-yellow text-xl font-bold leading-none">{value}</span>
              </div>
              <span className="text-brand-cream/50 text-xs leading-tight">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── Right image area (desktop only) ─── */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[58%] xl:w-[60%] z-10">

        {/* Fade edge into left panel */}
        <div
          className={`absolute inset-y-0 z-20 w-28 pointer-events-none bg-gradient-to-r from-brand-green to-transparent ${isRTL ? "right-0" : "left-0"}`}
        />

        {/* Slide counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute top-10 right-10 z-20 flex items-center gap-1.5 text-white/40 text-sm font-mono"
        >
          <span className="text-white/80 font-semibold">
            {String(current + 1).padStart(2, "0")}
          </span>
          <span>/</span>
          <span>{String(slides.length).padStart(2, "0")}</span>
        </motion.div>

        {/* Floating location card */}
        <motion.div
          key={`card-${current}`}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-14 right-10 z-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-4 min-w-[220px]"
        >
          <div className="w-11 h-11 rounded-full bg-brand-yellow/20 border border-brand-yellow/30 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-brand-yellow" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              {slides[current].location}
            </p>
            <p className="text-brand-cream/55 text-xs mt-0.5">Georgia · Must Visit 🇬🇪</p>
          </div>
        </motion.div>

        {/* Rating card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute top-1/3 right-10 z-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-5 py-4"
        >
          <div className="flex gap-0.5 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
            ))}
          </div>
          <p className="text-white text-sm font-semibold">4.9 / 5.0</p>
          <p className="text-brand-cream/50 text-xs mt-0.5">500+ reviews</p>
        </motion.div>
      </div>

      {/* Vertical accent divider line */}
      <div className="hidden lg:block absolute top-0 left-[46%] xl:left-[42%] h-full w-px bg-gradient-to-b from-transparent via-brand-yellow/40 to-transparent z-30" />
    </div>
  );
}
