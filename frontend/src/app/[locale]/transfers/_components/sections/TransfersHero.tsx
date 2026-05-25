import { useTranslations } from "next-intl";
import { Car, Shield, Clock } from "lucide-react";

export function TransfersHero() {
  const t = useTranslations("transfers");

  return (
    <section className="bg-brand-green relative overflow-hidden">
      {/* decorative circles */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-green-mid opacity-30 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-brand-green-dark opacity-40 pointer-events-none" />

      <div className="relative px-4 md:px-20 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-brand-yellow text-sm font-semibold uppercase tracking-widest mb-3">
            Daud Travel
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            {t("bookYourTransfer")}
          </h1>
          <p className="text-brand-cream/80 text-base md:text-lg max-w-xl">
            Premium airport & city transfers across Georgia — safe, punctual, comfortable.
          </p>

          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { icon: Shield, label: "Safe & Licensed" },
              { icon: Clock, label: "On-time Guarantee" },
              { icon: Car, label: "Modern Fleet" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-yellow/20 rounded-lg">
                  <Icon className="h-4 w-4 text-brand-yellow" />
                </div>
                <span className="text-brand-cream text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
