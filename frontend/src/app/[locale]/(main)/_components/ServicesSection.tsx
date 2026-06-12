"use client";

import { Map, Car, Shield, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Link } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import Svaneti from "@img/images/Svaneti.jpg";
import Batumi from "@img/images/Batumi.jpg";
import River from "@img/images/River.jpg";
import Piaza from "@img/images/Piaza.jpg";

const ServicesSection = () => {
  const t = useTranslations("main");

  const services = [
    {
      href: "/tours",
      image: Svaneti,
      alt: "Tours across the mountains of Georgia",
      icon: <Map className="w-5 h-5 text-white" />,
      title: t("serviceToursTitle"),
      description: t("serviceToursDesc"),
    },
    {
      href: "/transfers",
      image: Batumi,
      alt: "Transfer services in Georgia",
      icon: <Car className="w-5 h-5 text-white" />,
      title: t("serviceTransfersTitle"),
      description: t("serviceTransfersDesc"),
    },
    {
      href: "/insurance",
      image: River,
      alt: "Travel insurance for your trip to Georgia",
      icon: <Shield className="w-5 h-5 text-white" />,
      title: t("serviceInsuranceTitle"),
      description: t("serviceInsuranceDesc"),
    },
    {
      href: "/products",
      image: Piaza,
      alt: "Travel products and services from Daud Travel",
      icon: <ShoppingBag className="w-5 h-5 text-white" />,
      title: t("serviceProductsTitle"),
      description: t("serviceProductsDesc"),
    },
  ] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <section className="bg-brand-green-50 px-4 md:px-20 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-semibold tracking-widest">
          {t("ourServices")}
        </h2>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          {t("ourServicesDesc")}
        </p>
      </motion.div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {services.map((service) => (
          <motion.div key={service.href} variants={cardVariants}>
            <Link href={service.href} className="block h-full">
              <div className="group h-full bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="relative">
                  <Image
                    src={service.image}
                    alt={service.alt}
                    className="h-40 md:h-48 w-full object-cover rounded-xl"
                    loading="lazy"
                  />
                  <div className="absolute top-3 start-3 w-10 h-10 rounded-full bg-brand-green border-2 border-white flex items-center justify-center shadow-md">
                    {service.icon}
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2 pt-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {service.description}
                    </p>
                  </div>
                  <div className="shrink-0 w-9 h-9 rounded-full bg-brand-green-100 flex items-center justify-center group-hover:bg-brand-green transition-colors duration-300">
                    <ArrowRight className="w-4 h-4 text-brand-green group-hover:text-white transition-colors duration-300 rtl:rotate-180" />
                  </div>
                </div>
                <div className="w-12 h-1 rounded-full bg-brand-yellow mt-4" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default ServicesSection;
