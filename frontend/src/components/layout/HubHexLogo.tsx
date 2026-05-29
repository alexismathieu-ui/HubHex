import Link from "next/link";

interface HubHexLogoProps {
  href?: string;
  size?: number;
  showText?: boolean;
  className?: string;
}

export function HubHexLogo({
  href = "/tableau-de-bord",
  size = 36,
  showText = true,
  className = "",
}: HubHexLogoProps) {
  const content = (
    <>
      {/* img natif : evite l'icone cassee (triangle) si l'optimiseur Next echoue */}
      <img
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        decoding="async"
      />
      {showText ? (
        <span className="text-lg font-bold tracking-tight text-cyan-300">HubHex</span>
      ) : null}
    </>
  );

  const wrapperClass = `inline-flex items-center gap-2.5 ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${wrapperClass} transition hover:opacity-90`}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
