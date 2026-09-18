"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";

const ConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const t = useTranslations("header");

  useEffect(() => {
    const consent = localStorage.getItem("terms-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("terms-consent", "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("terms-consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-5 left-4 z-50 md:w-72 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border shadow-xl rounded-xl p-4">
      <div className="space-y-3">
        <p className="text-xs leading-relaxed">
          {t.rich("consentText", {
            terms: (chunks) => (
              <Link
                href="/terms"
                className="underline hover:no-underline font-medium"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                className="underline hover:no-underline font-medium"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleDecline}
            className="flex-1 px-3 py-2 text-xs border rounded-lg hover:bg-gray-100 transition"
          >
            {t("consentDecline")}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-3 py-2 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            {t("consentAccept")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
