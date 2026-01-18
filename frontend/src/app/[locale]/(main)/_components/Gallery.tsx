"use client";

import { CardContent } from "@/src/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/src/components/ui/carousel";
import Carting from "@img/images/Carting.jpg";
import Piaza from "@img/images/Piaza.jpg";
import Bicy from "@img/images/Bicy.jpg";
import Boat from "@img/images/Boat.jpg";
import Family from "@img/images/Family.jpg";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Gallery() {
  const t = useTranslations("main");
  const data = [
    { img: Carting, alt: "wineTour" },
    { img: Piaza, alt: "wineTour" },
    { img: Bicy, alt: "wineTour" },
    { img: Family, alt: "wineTour" },
    { img: Boat, alt: "wineTour" },
  ];

  return (
    <section className="z-10 relative flex h-full w-full flex-col items-center pt-20 py-12 md:mt-12">
      <h1 className="absolute top-2 text-lg pt-4 text-center  md:text-2xl tracking-widest font-semibold">
        {t("imagineYourselfHere")}
      </h1>
      <Carousel opts={{ loop: true }} className="mt-6 w-full">
        <CarouselContent className="w-full">
          {data.map((item, index) => (
            <CarouselItem
              key={index}
              className="md:basis-1/3 lg:basis-1/3 xl:basis-1/4 p-0"
            >
              <CardContent className="flex items-center justify-center px-4">
                <Image
                  src={item.img}
                  alt={item.alt}
                  className="h-[280px] w-full object-cover rounded-lg shadow-lg"
                />
              </CardContent>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:absolute -top-20 md:right-20 lg:right-40">
          <CarouselPrevious className="bg-mainGradient text-white w-8 h-8 md:w-10 md:h-10 border-white rounded-md border hover:bg-mainGradientHover hover:text-white" />
          <CarouselNext className="bg-mainGradient text-white w-8 h-8 md:w-10 md:h-10 border-white rounded-md border hover:bg-mainGradientHover hover:text-white" />
        </div>
      </Carousel>
    </section>
  );
}
