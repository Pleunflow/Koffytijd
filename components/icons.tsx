import { CarFront, Megaphone } from "lucide-react";

// Tijdelijke iconen. De officiële Toppy-SVG's (toppy-icon, megaphone, car-speed)
// zaten niet in de handoff-upload; vervang deze door de echte bestanden uit
// assets/icons/ (één kleur, #000 → currentColor).

type IconProps = { size?: number; className?: string };

/** Placeholder voor het Toppy-logo (wink). */
export function ToppyIcon({ size = 30, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <rect x="1" y="1" width="30" height="30" rx="9" />
      <circle cx="11" cy="13" r="2.6" fill="var(--color-toppy-ink)" />
      <path
        d="M18.2 13.2c1.4-1.6 3.7-1.6 5.1 0"
        stroke="var(--color-toppy-ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M9.5 19.5c3.4 3.6 9.6 3.6 13 0"
        stroke="var(--color-toppy-ink)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function MegaphoneIcon({ size = 38, className }: IconProps) {
  return <Megaphone size={size} strokeWidth={2.2} className={className} aria-hidden />;
}

export function CarSpeedIcon({ size = 18, className }: IconProps) {
  return <CarFront size={size} strokeWidth={2.4} className={className} aria-hidden />;
}
