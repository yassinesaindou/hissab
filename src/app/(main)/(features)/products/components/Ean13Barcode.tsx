// app/products/components/EAN13Barcode.tsx
"use client";

import { encodeEAN13, bitsToBars } from "@/lib/utils/ean13";

interface EAN13BarcodeProps {
  code: string;
  /** Width in px of a single narrow module. Standard scanners need >= 2px equivalent at print resolution. */
  unitWidth?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Renders a REAL, scanner-readable EAN-13 barcode as SVG.
 * Encodes the digits using the official EAN-13 bar-width tables —
 * this is not a decorative pattern, it round-trip decodes correctly
 * with standard barcode scanners (verified with pyzbar/zbar).
 */
export default function EAN13Barcode({
  code,
  unitWidth = 2.2,
  height = 70,
  showText = true,
  className = "",
}: EAN13BarcodeProps) {
  if (!/^\d{13}$/.test(code)) {
    return (
      <div className="text-xs text-rose-500 font-mono">
        Code EAN-13 invalide
      </div>
    );
  }

  let bits: string;
  try {
    bits = encodeEAN13(code);
  } catch {
    return (
      <div className="text-xs text-rose-500 font-mono">
        Erreur d&apos;encodage
      </div>
    );
  }

  const bars = bitsToBars(bits);
  const textHeight = showText ? 18 : 0;
  // Quiet zone (margin) required on each side for reliable scanning —
  // EAN-13 spec requires at least 9 modules on the left, 7 on the right.
  const quietZone = 10 * unitWidth;

  let x = quietZone;
  const rects: { x: number; width: number }[] = [];
  for (const bar of bars) {
    const w = bar.width * unitWidth;
    if (bar.isBar) rects.push({ x, width: w });
    x += w;
  }
  const totalWidth = x + quietZone;
  const totalHeight = height + textHeight;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      className={className}
      role="img"
      aria-label={`Code-barres EAN-13 ${code}`}
    >
      <rect x={0} y={0} width={totalWidth} height={totalHeight} fill="white" />
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={0} width={r.width} height={height} fill="#000000" />
      ))}
      {showText && (
        <text
          x={totalWidth / 2}
          y={height + 14}
          textAnchor="middle"
          fontFamily="ui-monospace, 'SF Mono', Consolas, monospace"
          fontSize={13}
          fontWeight={600}
          letterSpacing="1"
          fill="#111827"
        >
          {code}
        </text>
      )}
    </svg>
  );
}