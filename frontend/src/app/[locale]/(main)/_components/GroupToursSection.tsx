"use client";

import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/src/components/ui/carousel";
import { axiosInstance } from "@/src/utlis/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { Tour } from "@/src/types/tours.type";
import { useTranslations } from "next-intl";
import PoPularToursLoader from "@/src/components/shared/loader/PoPularToursLoader";
import { useParams } from "next/navigation";
import { TourCard } from "../../tours/_components/TourCard";
import { useState, useEffect } from "react";

export default function GroupToursSection() {
  const t = useTranslations("main");
  const params = useParams();
  const locale = params.locale as string;

  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  const { data: toursData, isLoading } = useQuery({
    queryKey: ["tours", "individualList"],
    queryFn: async () => {
      const params = {
        locale,
        type: "INDIVIDUAL",
      };

      const response = await axiosInstance.get("/tours", { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });

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

  return (
    <section className="w-full py-10 md:pt-12 lg:pt-20 pb-12 flex flex-col gap-8 md:gap-16 bg-[#f2f5ff]">
      <motion.div
        className="w-full md:px-20 flex justify-between items-center px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="flex flex-col gap-2">
          <motion.h1
            variants={headerVariants}
            className="text-xl md:text-3xl font-semibold text-start"
          >
            {t("groupTours")}
          </motion.h1>

          <motion.div
            variants={underlineVariants}
            className="h-[2px] w-80 md:w-[600px] bg-mainGradient"
          />
        </div>
      </motion.div>
      {isLoading ? (
        <PoPularToursLoader />
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
              {toursData?.data?.tours?.map((tour: Tour, index: number) => (
                <CarouselItem
                  key={tour.id}
                  className="lg:basis-1/2 md:basis-1/2 xl:basis-1/3 md:pr-7 md:pl-0 px-4 lg:pr-10 lg:pl-0 cursor-pointer hover:z-20"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    viewport={{ once: true }}
                    className="h-full"
                  >
                    <TourCard tour={tour} />
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <motion.div
              className="-top-12 right-16 block absolute md:-top-32 lg:-top-28 md:right-36 z-30"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <CarouselPrevious className="bg-mainGradient text-white w-8 h-8 lg:w-10 lg:h-10 border-white border hover:bg-mainGradientHover hover:text-white hover:shadow-lg rounded-md transition-all duration-300" />
              <CarouselNext className="bg-mainGradient text-white w-8 h-8 lg:w-10 lg:h-10 border-white border hover:bg-mainGradientHover hover:text-white hover:shadow-lg rounded-md transition-all duration-300" />
            </motion.div>
          </Carousel>

          <div className="flex justify-center gap-2 mt-2">
            {toursData?.data?.tours?.map((_: any, index: number) => (
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
        </motion.div>
      )}
    </section>
  );
}
