"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { MapPin, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  { src: "/images/Svaneti.jpg", alt: "Svaneti mountains", location: "Svaneti" },
  { src: "/images/Batumi.jpg", alt: "Batumi city", location: "Batumi" },
  { src: "/images/River.jpg", alt: "Georgian river", location: "Mtkvari River" },
];

const SLIDE_INTERVAL = 6000;

export default function CoverSection() {
  const t = useTranslations("main");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setCurrent((p) => (p + 1) % slides.length),
      SLIDE_INTERVAL
    );
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => setCurrent((i + slides.length) % slides.length);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section
      className="relative w-full h-[100svh] min-h-[560px] overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ─── Full-bleed image slideshow ─── */}
      {slides.map((slide, i) => (
        <motion.div
          key={slide.src}
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: i === current ? 1 : 0,
            scale: i === current ? 1 : 1.06,
          }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: 7 } }}
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

      {/* Readability overlays */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* ─── Centered content ─── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 text-brand-yellow text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-5"
        >
          <span className="h-px w-8 bg-brand-yellow/70 hidden sm:block" />
          {t("findEmotions")}
          <span className="h-px w-8 bg-brand-yellow/70 hidden sm:block" />
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-white font-extrabold leading-[1.08] tracking-tight max-w-3xl drop-shadow-lg"
          style={{ fontSize: "clamp(1.9rem, 4.2vw, 3.5rem)" }}
        >
          {t("exploreGeorgia")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/85 text-sm md:text-base max-w-xl mt-4 drop-shadow"
        >
          {t("trustedPart")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-9"
        >
          <Link href="/tours">
            <span className="inline-flex items-center gap-2 px-7 py-3 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-green font-bold text-sm rounded-full transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 cursor-pointer">
              {t("exploreTours")}
              <ArrowIcon className="w-4 h-4" />
            </span>
          </Link>
          <Link href="/transfers">
            <span className="inline-flex items-center gap-2 px-7 py-3 border border-white/60 hover:bg-white/10 text-white font-semibold text-sm rounded-full backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-black/20 cursor-pointer">
              {t("bookTransfer")}
            </span>
          </Link>
        </motion.div>
      </div>

      {/* ─── Bottom bar: location + slide controls ─── */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 md:px-12 pb-7 flex items-end justify-between gap-4">
        {/* Current location */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-white"
          >
            <MapPin className="w-4 h-4 text-brand-yellow shrink-0" />
            <span className="text-sm font-semibold drop-shadow">
              {slides[current].location}, Georgia
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Dots + arrows */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 h-2 bg-brand-yellow"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => goTo(current - 1)}
              aria-label="Previous slide"
              className="w-10 h-10 rounded-full border border-white/40 text-white hover:bg-white/15 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={() => goTo(current + 1)}
              aria-label="Next slide"
              className="w-10 h-10 rounded-full border border-white/40 text-white hover:bg-white/15 flex items-center justify-center transition-colors"
            >
              <ChevronRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
