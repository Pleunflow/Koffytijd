import { CarFront, Megaphone } from "lucide-react";
import Image from "next/image";

type IconProps = { size?: number; className?: string };

/** Het Toppy-logo (wink met hartje). Bron: public/toppy-icon.png. */
export function ToppyIcon({ size = 36, className }: IconProps) {
  return (
    <Image
      src="/toppy-icon.png"
      alt="Toppy"
      width={size}
      height={size}
      priority
      className={className}
    />
  );
}

// Tijdelijke iconen: de officiële Toppy-SVG's voor megafoon en auto (car-speed)
// zaten niet in de handoff. Vervang ze door de echte bestanden (één kleur, currentColor).
export function MegaphoneIcon({ size = 38, className }: IconProps) {
  return <Megaphone size={size} strokeWidth={2.2} className={className} aria-hidden />;
}

export function CarSpeedIcon({ size = 18, className }: IconProps) {
  return <CarFront size={size} strokeWidth={2.4} className={className} aria-hidden />;
}
