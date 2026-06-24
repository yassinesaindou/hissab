/* eslint-disable @typescript-eslint/no-explicit-any */
// app/transactions/components/TransactionDetailSheet.tsx
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
import { TransactionWithUser } from "@/lib/types/index";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  User,
  Package,
  Hash,
  Banknote,
  ShoppingCart,
  Edit,
  Trash2,
  Receipt,
} from "lucide-react";

interface TransactionDetailSheetProps {
  transaction: TransactionWithUser | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (transaction: TransactionWithUser) => void;
  onDelete: (transactionId: string) => void;
  /** Hide edit/delete for employees */
  canMutate: boolean;
}

const TYPE_CONFIG = {
  sale: {
    label: "Vente",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    headerClass: "from-emerald-500 to-emerald-600",
    icon: <TrendingUp className="h-5 w-5" />,
    amountClass: "text-emerald-600",
  },
  expense: {
    label: "Dépense",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    headerClass: "from-rose-500 to-rose-600",
    icon: <TrendingDown className="h-5 w-5" />,
    amountClass: "text-rose-600",
  },
  credit: {
    label: "Crédit",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    headerClass: "from-amber-500 to-amber-600",
    icon: <CreditCard className="h-5 w-5" />,
    amountClass: "text-amber-600",
  },
} as const;

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

export default function TransactionDetailSheet({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canMutate,
}: TransactionDetailSheetProps) {
  if (!transaction) return null;

  const cfg = TYPE_CONFIG[transaction.type] ?? TYPE_CONFIG.sale;
  const date = new Date(transaction.created_at);

  const handleDelete = () => {
    if (confirm("Supprimer cette transaction ?")) {
      onDelete(transaction.transactionId);
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden"
      >
        {/* ── Coloured header strip ─────────────────────────────────────── */}
        <div
          className={`bg-gradient-to-br ${cfg.headerClass} px-6 py-6 text-white shrink-0`}
        >
          <SheetHeader className="mb-0">
            <SheetTitle className="text-white text-lg font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Détail de la transaction
            </SheetTitle>
          </SheetHeader>

          {/* Amount hero */}
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                Montant total
              </p>
              <p className="text-4xl font-bold tracking-tight">
                {(transaction.totalPrice ?? 0).toLocaleString("fr-FR")}
                <span className="text-2xl font-medium ml-1.5">Fcs</span>
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-sm font-semibold border ${cfg.badgeClass} bg-white/90`}
            >
              {cfg.icon}
              <span className="ml-1.5">{cfg.label}</span>
            </Badge>
          </div>
        </div>

        {/* ── Detail rows ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <DetailRow
            icon={<Package className="h-4 w-4" />}
            label="Article"
            value={transaction.productName ?? "—"}
          />
          <Separator className="my-0" />

          <DetailRow
            icon={<Banknote className="h-4 w-4" />}
            label="Prix unitaire"
            value={`${(transaction.unitPrice ?? 0).toLocaleString("fr-FR")} Fcs`}
          />
          <Separator className="my-0" />

          <DetailRow
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Quantité"
            value={String(transaction.quantity ?? 1)}
          />
          <Separator className="my-0" />

          <DetailRow
            icon={<Banknote className="h-4 w-4" />}
            label="Total"
            value={`${(transaction.totalPrice ?? 0).toLocaleString("fr-FR")} Fcs`}
            valueClass={cfg.amountClass}
          />
          <Separator className="my-0" />

          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label="Date"
            value={
              <>
                {format(date, "EEEE dd MMMM yyyy", { locale: fr })}
                <span className="block text-gray-400 font-normal text-xs mt-0.5">
                  {format(date, "HH:mm:ss", { locale: fr })}
                </span>
              </>
            }
          />
          <Separator className="my-0" />

          <DetailRow
            icon={<User className="h-4 w-4" />}
            label="Enregistré par"
            value={(transaction as any).userName ?? "Inconnu"}
          />
          <Separator className="my-0" />

          <DetailRow
            icon={<Hash className="h-4 w-4" />}
            label="ID transaction"
            value={
              <span className="font-mono text-xs text-gray-500 break-all">
                {transaction.transactionId}
              </span>
            }
          />

          {transaction.description && (
            <>
              <Separator className="my-0" />
              <DetailRow
                icon={<Receipt className="h-4 w-4" />}
                label="Description"
                value={transaction.description}
                valueClass="text-gray-600 font-normal"
              />
            </>
          )}
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        {canMutate && (
          <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}