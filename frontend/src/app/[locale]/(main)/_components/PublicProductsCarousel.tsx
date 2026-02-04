"use client";

import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/src/components/ui/carousel";
import { useState, useEffect } from "react";
import { usePublicQuickLinks } from "@/src/hooks/quick-payment/useQuickPayment";
import { Loader2, ShoppingCart, Package } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PublicProductsCarousel() {
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const t = useTranslations("main");

  const { data: productsData, isLoading } = usePublicQuickLinks(1, 10);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);
    handleSelect();

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const underlineVariants = {
    hidden: { width: 0 },
    visible: {
      width: "100%",
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const products = productsData?.data || [];

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-10 md:pt-12 lg:pt-20 pb-12 flex flex-col gap-8 md:gap-16 bg-[#f2f5ff]">
      <motion.div
        className="w-full md:px-20 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="flex justify-between items-center mb-2">
          <motion.h1
            variants={headerVariants}
            className="text-xl md:text-3xl font-semibold text-start"
          >
            {t("products")}
          </motion.h1>

          <Link
            href="/products"
            className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-mainGradient text-white rounded-lg hover:bg-mainGradientHover transition-all hover:shadow-lg font-medium"
          >
            {t("viewMore")}
          </Link>
        </div>

        <motion.div
          variants={underlineVariants}
          className="h-[2px] w-80 md:w-[600px] bg-mainGradient"
        />
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin" size={40} />
        </div>
      ) : (
        <motion.div
          className="flex flex-col justify-center items-center relative md:px-0 gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Carousel
            opts={{
              loop: true,
              align: "start",
            }}
            className="w-full md:px-20"
            setApi={setApi}
          >
            <CarouselContent className="z-10">
              {products.map((product: any, index: number) => (
                <CarouselItem
                  key={product.id}
                  className="lg:basis-1/2 md:basis-1/2 xl:basis-1/3 md:pr-7 md:pl-0 px-4 lg:pr-10 lg:pl-0 cursor-pointer hover:z-20"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    viewport={{ once: true }}
                    className="h-full"
                  >
                    <Link href={`/pay/${product.slug}`}>
                      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        <div className="relative h-64 bg-gray-100">
                          {product.image ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-20 h-20 text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                {product.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="text-2xl font-bold text-green-600">
                              ₾{product.price}
                            </div>
                            <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
                              <ShoppingCart size={20} />
                              <span className="font-medium">შეძენა</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="flex justify-center gap-2 mt-2">
            {products.map((_: any, index: number) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  current === index ? "w-4 bg-mainGradient" : "w-2 bg-gray-300"
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Link
            href="/products"
            className="md:hidden flex items-center gap-2 px-6 py-3 bg-mainGradient text-white rounded-lg hover:bg-mainGradientHover transition-colors"
          >
            {t("viewMore")}
          </Link>
        </motion.div>
      )}
    </section>
  );
}
