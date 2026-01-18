"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

const CoverSection = () => {
  const t = useTranslations("main");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";

  const [currentImage, setCurrentImage] = useState(0);
  const images = [
    { src: "/images/Svaneti.jpg", alt: "Tours in Georgia" },
    { src: "/images/Batumi.jpg", alt: "Tours in Georgia" },
    { src: "/images/River.jpg", alt: "Tours in Georgia" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div
      className={`relative w-full min-h-screen md:h-[800px] overflow-hidden bg-white ${isRTL ? "rtl" : "ltr"}`}
    >
      {images.map((image, index) => (
        <motion.div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            index === currentImage ? "opacity-100" : "opacity-0"
          }`}
          initial={{ scale: 1.1 }}
          animate={{
            scale: index === currentImage ? 1 : 1.1,
          }}
          transition={{
            duration: 6,
            ease: "linear",
          }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            layout="fill"
            objectFit="cover"
            className="w-full h-full object-center brightness-75"
          />
        </motion.div>
      ))}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-4">
        <div
          className={`text-center space-y-8 ${isRTL ? "text-right" : "text-left"}`}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-7xl font-bold h-24 sm:h-16 lg:h-24 mb-4 bg-clip-text text-transparent bg-textGradient"
          >
            {t("exploreGeorgia")}
          </motion.h1>
          {/* <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-white font-semibold"
          >
            {t("exploreGeorgia")}
          </motion.p> */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-md mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Link href="/tours">
                <Button className="w-full md:w-auto px-8 py-4 text-sm md:text-lg rounded-base transition-all duration-200 hover:scale-105">
                  {t("exploreTours")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CoverSection;
