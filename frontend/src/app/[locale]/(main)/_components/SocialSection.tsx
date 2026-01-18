import {
  Facebook,
  Instagram,
  Snapchat,
  Telegram,
  Tiktok,
  Whatsapp,
  X,
  Youtube,
} from "@/src/components/svg";
import { MapPin } from "lucide-react";

export const SocialSection = () => {
  return (
    <div className="border-t flex sticky border-t-slate-200 shadow-lg bottom-0 w-full z-50 justify-center items-center flex-col py-4 md:py-5 bg-[#f2f5ff]">
      <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
        <a
          target="_blank"
          href="https://snapchat.com/t/8hVjNvTK"
          className="hover:fill-main"
          aria-label="Snapchat"
        >
          <Snapchat className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a
          target="_blank"
          href="https://youtube.com/@daud_travel?si=FIOhdNS_KLMb_8Me"
          className="hover:fill-main"
          aria-label="Youtube"
        >
          <Youtube className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a
          target="_blank"
          href="https://www.tiktok.com/@daud_travel?_t=8qj9xNGY8dm&_r=1"
          className="hover:fill-main"
          aria-label="TikTok"
        >
          <Tiktok className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a
          target="_blank"
          href="https://www.instagram.com/daud_travel?igsh=dWlxZnYybGJwb2Rx&utm_source=qr"
          className="hover:fill-main"
          aria-label="Instagram"
        >
          <Instagram className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a
          target="_blank"
          href="https://www.facebook.com/share/mfSUtXxwN4HnpaQW/?mibextid=LQQJ4d1"
          className="hover:fill-main"
          aria-label="Facebook"
        >
          <Facebook className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a
          target="_blank"
          href="https://t.me/daud_travel"
          className="hover:fill-main"
          aria-label="Telegram"
        >
          <Telegram className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a
          target="_blank"
          href="https://wa.me/995557442212"
          className="hover:fill-main"
          aria-label="WhatsApp"
        >
          <Whatsapp className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a
          target="_blank"
          href="https://twitter.com/daud_travel"
          className="hover:fill-main"
          aria-label="X"
        >
          <X className="w-6 h-6 md:w-7 md:h-7" />
        </a>
        <a
          href="https://www.google.com/maps/place/Daud+Travel/@41.6443898,41.6346718,696m/data=!3m2!1e3!4b1!4m6!3m5!1s0x406787f6f7466e93:0x69bea43bb941487c!8m2!3d41.6443898!4d41.6346718!16s%2Fg%2F11s2jbmn0l?entry=ttu&g_ep=EgoyMDI0MTAyOS4wIKXMDSoASAFQAw%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Address"
          className="hover:fill-main"
        >
          <MapPin className="w-6 h-6 md:w-7 md:h-7 hover:text-main" />
        </a>
      </div>
    </div>
  );
};
