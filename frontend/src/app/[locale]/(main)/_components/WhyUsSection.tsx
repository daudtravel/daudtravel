"use client";

import { useState, useEffect, useRef } from "react";
import { WorldMap } from "@/src/components/svg";
import { Clock, MapPin, MapPinCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";

export default function WhyUsSection() {
  const t = useTranslations("main");
  const [stats, setStats] = useState({
    clients: 0,
    tours: 0,
    destinations: 0,
    years: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const finalStats = {
    clients: 1000,
    tours: 200,
    destinations: 10,
    years: 5,
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incrementStats = (finalStats: any) => {
      const progress = step / steps;
      setStats({
        clients: Math.round(finalStats.clients * progress),
        tours: Math.round(finalStats.tours * progress),
        destinations: Math.round(finalStats.destinations * progress),
        years: Math.round(finalStats.years * progress),
      });
      step++;
    };

    const animationInterval = setInterval(() => {
      if (step <= steps) {
        incrementStats(finalStats);
      } else {
        clearInterval(animationInterval);
        setStats(finalStats);
      }
    }, interval);

    return () => {
      clearInterval(animationInterval);
    };
  }, [isVisible]);

  const statCards = [
    {
      Icon: User,
      value: stats.clients,
      label: t("happyClient"),
      delay: "delay-0",
    },
    {
      Icon: MapPinCheck,
      value: stats.tours,
      label: t("toursCompleted"),
      delay: "delay-100",
    },
    {
      Icon: MapPin,
      value: stats.destinations,
      label: t("destinations"),
      delay: "delay-200",
    },
    {
      Icon: Clock,
      value: stats.years,
      label: t("yearsExperience"),
      delay: "delay-300",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="w-full bg-white pt-10 pb-20 px-4 md:px-7 lg:px-20 md:py-12 lg:py-24"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 md:gap-8 lg:gap-10">
        <div
          className={`flex flex-col justify-center gap-6 lg:gap-8 lg:w-[470px] transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
        >
          <h1 className="text-2xl md:text-3xl md:text-center lg:text-4xl text-center font-semibold leading-tight">
            {t("whyUs")}
          </h1>
          <p className="text-slate-700 text-base text-center">
            {t("trustedPart")}
          </p>
        </div>

        <div className="relative flex-1">
          <WorldMap
            className={`h-full md:h-[250px] lg:h-[300px] absolute w-full -top-28 md:-top-0 object-cover transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          />

          <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-md mx-auto relative md:pt-16 pt-36">
            {statCards.map(({ Icon, value, label, delay }) => (
              <div
                key={label}
                className={`bg-white py-3 shadow-lg rounded-lg flex flex-col items-center transform transition-all duration-700 ${delay} ${
                  isVisible
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-10 scale-95"
                }`}
              >
                <Icon className="h-6 w-6 md:h-8 md:w-8 text-primary-500" />
                <div className="text-xl md:text-2xl font-semibold">
                  {value.toLocaleString()}+
                </div>
                <div className="text-slate-600 text-xs text-center">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
