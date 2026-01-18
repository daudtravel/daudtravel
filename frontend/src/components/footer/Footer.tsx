import Link from "next/link";

export default function Footer() {
  return (
    <>
      <footer className="relative flex h-auto w-full flex-col bg-mainGradientHover">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 py-3">
          <p className="text-xs text-white">© 2025 Daud Travel</p>
          <div className="flex items-center gap-3 text-xs text-white">
            <Link href="/terms" className="hover:underline transition">
              წესები და პირობები
            </Link>
            <span>|</span>
            <Link href="/privacy" className="hover:underline transition">
              კონფიდენციალურობა
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
