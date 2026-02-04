"use client";

import { Shield } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";

const InsuranceSection = () => {
  const t = useTranslations("main");

  return (
    <section className="bg-[#f2f5ff] px-4 md:px-20 py-12">
      <div className="w-full max-w-3xl mx-auto">
        <Link href="/insurance">
          <motion.div
            className="bg-white rounded-2xl p-6 md:p-12 shadow-md cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center">
              <Shield className="w-12 h-12 md:w-16 md:h-16 text-[#ff6b35] mx-auto mb-4" />

              <h2 className="text-2xl md:text-4xl font-bold text-black mb-3 md:mb-4">
                {t("travelInsurance") || "Travel Insurance"}
              </h2>

              <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8">
                {t("wantTravelInsurance") || "Want Travel Insurance?"}
              </p>

              <Button className="text-sm md:text-base px-6 md:px-8 h-9">
                {t("getItHere") || "Get It Here"}
              </Button>
            </div>
          </motion.div>
        </Link>
      </div>
    </section>
  );
};

export default InsuranceSection;
