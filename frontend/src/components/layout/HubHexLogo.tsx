import Link from "next/link";

interface HubHexLogoProps {
  href?: string;
  /** Taille du pictogramme en px (hauteur = largeur) */
  size?: number;
  showText?: boolean;
  className?: string;
}

function textClassForSize(size: number) {
  if (size >= 52) return "text-xl md:text-2xl";
  if (size >= 44) return "text-lg md:text-xl";
  return "text-base md:text-lg";
}

function gapForSize(size: number) {
  if (size >= 48) return "gap-2.5";
  return "gap-2";
}

export function HubHexLogo({
  href = "/tableau-de-bord",
  size = 48,
  showText = true,
  className = "",
}: HubHexLogoProps) {
  const content = (
    <>
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo.png"
          alt=""
          width={size}
          height={size}
          className="block h-full w-full object-contain object-center drop-shadow-[0_0_10px_rgba(34,211,238,0.18)]"
          decoding="async"
        />
      </span>
      {showText ? (
        <span
          className={`self-center font-display font-semibold leading-none tracking-wide text-cyan-300/95 ${textClassForSize(size)}`}
        >
          HubHex
        </span>
      ) : null}
    </>
  );

  const wrapperClass = `inline-flex items-center ${gapForSize(size)} ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${wrapperClass} transition hover:opacity-90`}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
