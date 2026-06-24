/* eslint-disable react/no-unescaped-entities */
// components/ProductCombobox.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  productCode?: string;
}

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onChange: (productId: string, product?: Product) => void;
  onCustomProduct: (name: string) => void;
  placeholder?: string;
  /** Imperative handle so a parent (e.g. a scan button) can push a scanned code in directly */
  externalSearchQuery?: string;
}

export default function ProductCombobox({
  products = [],
  value,
  onChange,
  onCustomProduct,
  placeholder = "Sélectionner un produit",
  externalSearchQuery,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Initialize display value based on current value
  useEffect(() => {
    if (value && products.length > 0) {
      const product = products.find((p) => p.productId === value);
      if (product) {
        setDisplayValue(product.name);
      }
    } else {
      setDisplayValue("");
    }
  }, [value, products]);

  // Allow a parent component (scan button) to push a search term in directly
  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== "") {
      setSearchQuery(externalSearchQuery);
      setOpen(true);
    }
  }, [externalSearchQuery]);

  // Filter products — matches on name OR productCode
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchesName = product.name.toLowerCase().includes(query);
    const matchesCode = product.productCode
      ? product.productCode.toLowerCase().includes(query)
      : false;
    return matchesName || matchesCode;
  });

  const handleProductSelect = (product: Product) => {
    setDisplayValue(product.name);
    onChange(product.productId, product);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCustomProduct = () => {
    if (searchQuery.trim()) {
      setDisplayValue(searchQuery);
      onChange("", undefined);
      onCustomProduct(searchQuery);
      setOpen(false);
      setSearchQuery("");
    }
  };

  // Focus command input when popover opens
  useEffect(() => {
    if (open && commandInputRef.current) {
      setTimeout(() => {
        commandInputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  // Exact productCode match → auto-select immediately (used after a camera scan)
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) return;
    const exactCodeMatch = products.find(
      (p) => p.productCode?.toLowerCase() === query.toLowerCase()
    );
    if (exactCodeMatch) {
      handleProductSelect(exactCodeMatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, products]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="space-y-2">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 text-left font-normal hover:bg-white"
          >
            <span className={cn("truncate", !displayValue && "text-gray-500")}>
              {displayValue || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        className="w-full p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            ref={commandInputRef}
            placeholder="Rechercher par nom ou code-barres..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-11"
          />
          <CommandList>
            {/* Custom product option — only show if search doesn't match exactly */}
            {searchQuery.trim() &&
              !products.some(
                (p) =>
                  p.name.toLowerCase() === searchQuery.toLowerCase().trim() ||
                  p.productCode?.toLowerCase() === searchQuery.toLowerCase().trim()
              ) && (
                <CommandGroup heading="Créer nouveau produit">
                  <CommandItem onSelect={handleCustomProduct} className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-medium">"{searchQuery}"</span>
                      <span className="text-xs text-gray-500 block">
                        Utiliser comme nouveau produit
                      </span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

            {/* Existing products */}
            {filteredProducts.length > 0 && (
              <CommandGroup heading="Produits existants">
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.productId}
                    onSelect={() => handleProductSelect(product)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === product.productId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span>Stock: {product.stock}</span>
                        <span>•</span>
                        <span>{product.unitPrice.toLocaleString()} Fcs</span>
                        {product.productCode && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5 font-mono">
                              <Barcode className="h-3 w-3" />
                              {product.productCode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
              {products.length === 0
                ? "Aucun produit disponible. Tapez pour créer un nouveau."
                : "Tapez un nom ou un code-barres (nouveau ou existant)"}
            </CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}