"use client";

import { Car, Clock, Shield, MapPin } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";

const TransferSection = () => {
  const t = useTranslations("main");

  const transferFeatures = [
    {
      icon: <Car className="w-8 h-8 text-[orange] mb-4" />,
      title: t("modernCars"),
    },
    {
      icon: <Clock className="w-8 h-8 text-[#ffa500] mb-4" />,
      title: t("available"),
    },
    {
      icon: <Shield className="w-8 h-8 text-[orange] mb-4" />,
      title: t("licensedDrivers"),
    },
    {
      icon: <MapPin className="w-8 h-8 text-[orange] mb-4" />,
      title: t("doorToDoor"),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const featureVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        duration: 0.6,
      },
    },
  };

  const headingVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.8,
      },
    },
  };

  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 12,
        delay: 0.8,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <section className="relative overflow-hidden bg-[#f2f5ff] px-4 md:px-20 py-12">
      <div className="w-full relative z-10">
        <motion.h2
          className="text-2xl md:text-3xl mb-6 text-center font-semibold tracking-widest pb-4"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {t("ourTransferServices")}
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8  w-full items-start"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {transferFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="text-center p-3 md:p-6 rounded-lg bg-white shadow-md"
              variants={featureVariants}
              whileHover={{
                y: -5,
                scale: 1.02,
                boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                },
              }}
            >
              <motion.div
                className="flex justify-center"
                whileHover={{
                  rotate: [0, -10, 10, -10, 0],
                  transition: { duration: 0.5 },
                }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-sm md:text-base text-black mb-3">
                {feature.title}
              </h3>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          className="text-center text-xl mt-6 md:mt-12"
          variants={buttonVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <Link href="/transfers">
              <Button className="text-sm md:text-base px-4 py-2 md:px-7 h-9">
                {t("bookTransfer")}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TransferSection;