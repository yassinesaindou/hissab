/* eslint-disable react/no-unescaped-entities */
// components/ProductCombobox.tsx - DEBUGGED VERSION
"use client";

import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
}

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onChange: (productId: string, product?: Product) => void;
  onCustomProduct: (name: string) => void;
  placeholder?: string;
}

export default function ProductCombobox({
  products = [],
  value,
  onChange,
  onCustomProduct,
  placeholder = "Sélectionner un produit"
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Debug log
  console.log("ProductCombobox - Products:", products);
  console.log("ProductCombobox - Current value:", value);

  // Initialize display value based on current value
  useEffect(() => {
    if (value && products.length > 0) {
      const product = products.find(p => p.productId === value);
      console.log("ProductCombobox - Found product:", product);
      if (product) {
        setDisplayValue(product.name);
      }
    } else {
      setDisplayValue("");
    }
  }, [value, products]);

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    console.log("ProductCombobox - Product selected:", product);
    console.log("ProductCombobox - Product price:", product.unitPrice);
    
    setDisplayValue(product.name);
    // PASS THE PRODUCT DATA HERE
    onChange(product.productId, product);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCustomProduct = () => {
    if (searchQuery.trim()) {
      console.log("ProductCombobox - Custom product:", searchQuery);
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
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-11"
          />
          <CommandList>
            {/* Custom product option - only show if search doesn't match exactly */}
            {searchQuery.trim() && !products.some(p => p.name.toLowerCase() === searchQuery.toLowerCase().trim()) && (
              <CommandGroup heading="Créer nouveau produit">
                <CommandItem
                  onSelect={handleCustomProduct}
                  className="cursor-pointer"
                >
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
                      <div className="text-xs text-gray-500">
                        Stock: {product.stock} • {product.unitPrice.toLocaleString()} Fcs
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
              {products.length === 0 
                ? "Aucun produit disponible. Tapez pour créer un nouveau."
                : "Tapez le nom d'un produit (nouveau ou existant)"}
            </CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}