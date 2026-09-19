import Image from "next/image";

/** Brand loader shown while the session is being checked. */
export default function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-cream/60"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-brand-green-100" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-green" />
        <Image
          src="/favicon-32x32.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8"
          priority
        />
      </div>
      {label && <p className="text-sm font-medium text-brand-green">{label}</p>}
    </div>
  );
}
