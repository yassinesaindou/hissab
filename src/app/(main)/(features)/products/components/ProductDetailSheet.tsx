/* eslint-disable @typescript-eslint/no-unused-vars */
// app/products/components/ProductDetailSheet.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Product } from "../actions/actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Package,
  Barcode,
  Tag,
  Banknote,
  Boxes,
  Calendar,
  FileText,
  Edit,
  Printer,
  Plus,
  Minus,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import EAN13Barcode from "./Ean13Barcode";
import { encodeEAN13, bitsToBars, isValidEAN13 } from "@/lib/utils/ean13";

interface ProductDetailSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product, type: "increase" | "decrease") => void;
  canMutate: boolean;
}

function DetailRow({
  icon,
  label,
  value,
  valueClass = "text-gray-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className={`text-sm font-semibold break-words ${valueClass}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ProductDetailSheet({
  product,
  isOpen,
  onClose,
  onEdit,
  onAdjustStock,
  canMutate,
}: ProductDetailSheetProps) {
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const isOut = product.stock === 0;
  const isLow = product.stock > 0 && product.stock <= 10;
  const stockColor = isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600";
  const stockBg = isOut ? "from-rose-500 to-rose-600" : isLow ? "from-amber-500 to-amber-600" : "from-emerald-500 to-emerald-600";

  const formattedCode =
    product.productCode?.length === 13
      ? `${product.productCode[0]} · ${product.productCode.slice(1, 7)} · ${product.productCode.slice(7)}`
      : product.productCode;

  const handleCopy = () => {
    if (!product.productCode) return;
    navigator.clipboard.writeText(product.productCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  // Opens a new window with a printable, REAL scannable barcode label
  const handlePrint = () => {
    const code = product.productCode;
    if (!code || !/^\d{13}$/.test(code)) return;

    const printWindow = window.open("", "_blank", "width=420,height=320");
    if (!printWindow) return;

    // Build the real EAN-13 bar pattern (same encoder used on-screen)
    const bits = encodeEAN13(code);
    const bars = bitsToBars(bits);

    const unitWidth = 2.6; // px per module — generous for reliable print scanning
    const barHeight = 70;
    const quietZone = 10 * unitWidth; // required blank margin on each side

    let x = quietZone;
    const rects: string[] = [];
    for (const bar of bars) {
      const w = bar.width * unitWidth;
      if (bar.isBar) {
        rects.push(`<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="#000"/>`);
      }
      x += w;
    }
    const svgWidth = x + quietZone;

    const barcodeSvg = `
      <svg viewBox="0 0 ${svgWidth} ${barHeight}" width="${svgWidth}" height="${barHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${svgWidth}" height="${barHeight}" fill="#fff"/>
        ${rects.join("")}
      </svg>
    `;

    const formatted = `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Étiquette — ${product.name}</title>
          <style>
            @page { size: 70mm 40mm; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, Helvetica, Arial, sans-serif;
              width: 70mm;
              height: 40mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 4mm;
              gap: 1.5mm;
            }
            .name {
              font-size: 11px;
              font-weight: 700;
              text-align: center;
              max-width: 62mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .price {
              font-size: 13px;
              font-weight: 800;
              color: #047857;
            }
            svg { max-width: 62mm; height: auto; }
            .code {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              letter-spacing: 2px;
              font-weight: 600;
            }
            @media print {
              html, body { width: 70mm; height: 40mm; }
            }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = () => window.close();">
          <div class="name">${product.name}</div>
          <div class="price">${product.unitPrice.toLocaleString()} Fcs</div>
          ${barcodeSvg}
          <div class="code">${formatted}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden"
      >
        {/* ── Header strip ──────────────────────────────────────────────── */}
        <div className={`bg-gradient-to-br ${stockBg} px-6 py-6 text-white shrink-0`}>
          <SheetHeader className="mb-0">
            <SheetTitle className="text-white text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Détail de l&apos;article
            </SheetTitle>
          </SheetHeader>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                Stock actuel
              </p>
              <p className="text-4xl font-bold tracking-tight">{product.stock}</p>
            </div>
            <Badge
              variant="outline"
              className="text-sm font-semibold border bg-white/90 text-gray-800 shrink-0"
            >
              {isOut ? "Rupture" : isLow ? "Stock faible" : "En stock"}
            </Badge>
          </div>
        </div>

        {/* ── Detail rows ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <DetailRow
            icon={<Tag className="h-4 w-4" />}
            label="Nom"
            value={product.name}
          />
          <Separator className="my-0" />

          <DetailRow
            icon={<Banknote className="h-4 w-4" />}
            label="Prix unitaire"
            value={`${product.unitPrice.toLocaleString("fr-FR")} Fcs`}
            valueClass="text-emerald-600"
          />
          <Separator className="my-0" />

          <DetailRow
            icon={<Boxes className="h-4 w-4" />}
            label="Catégorie"
            value={product.category || "Général"}
          />
          <Separator className="my-0" />

          {/* Barcode block */}
          <div className="flex items-start gap-3 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <Barcode className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Code EAN-13
              </p>
              {product.productCode ? (
                <div className="rounded-lg border border-indigo-100 bg-white px-3 py-3 flex flex-col items-center gap-2">
                  <EAN13Barcode code={product.productCode} unitWidth={2} height={56} showText={false} />
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-gray-800 tracking-widest">
                      {formattedCode}
                    </p>
                    <button
                      onClick={handleCopy}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Copier le code"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {!isValidEAN13(product.productCode) && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 rounded px-2 py-0.5">
                      ⚠ Checksum invalide — peut ne pas être lisible par un scanner
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aucun code</p>
              )}
            </div>
          </div>
          <Separator className="my-0" />

          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label="Ajouté le"
            value={format(new Date(product.created_at), "dd MMMM yyyy", { locale: fr })}
          />

          {product.description && (
            <>
              <Separator className="my-0" />
              <DetailRow
                icon={<FileText className="h-4 w-4" />}
                label="Description"
                value={product.description}
                valueClass="text-gray-600 font-normal"
              />
            </>
          )}
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-4 space-y-2.5">
          {/* Print button — only available for a valid, scannable EAN-13 */}
          <Button
            variant="outline"
            className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            onClick={handlePrint}
            disabled={!product.productCode || !isValidEAN13(product.productCode)}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimer l&apos;étiquette
          </Button>

          {canMutate && (
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => onEdit(product)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => onAdjustStock(product, "increase")}
                title="Ajouter au stock"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => onAdjustStock(product, "decrease")}
                title="Réduire le stock"
                disabled={product.stock === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}