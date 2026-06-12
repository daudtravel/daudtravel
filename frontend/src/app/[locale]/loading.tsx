import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-green-50/70 backdrop-blur-md">
      <div className="relative flex items-center justify-center w-40 h-40">
        <div className="absolute inset-0 rounded-full border-4 border-brand-green-100 border-t-brand-green animate-spin" />
        <div className="absolute inset-3 rounded-full bg-white/80 shadow-xl" />
        <Image
          src="/images/Logo.png"
          alt="Daud Travel"
          width={104}
          height={104}
          priority
          className="relative object-contain"
        />
      </div>
    </div>
  );
}
