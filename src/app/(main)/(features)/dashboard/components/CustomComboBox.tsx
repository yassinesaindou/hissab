/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSelectExisting?: (product: {
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }) => void;
  options: Array<{
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomCombobox({
  value,
  onChange,
  onSelectExisting,
  options,
  placeholder = "Rechercher ou créer un produit...",
  className,
  disabled = false,
}: CustomComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    onChange(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSelectOption = (option: (typeof options)[0] | null) => {
    if (option) {
      onChange(option.name);
      onSelectExisting?.(option);
    } else {
      onChange(search); // Use typed value as new product
    }
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredOptions.length ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : filteredOptions.length));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex === -1 && search.trim()) {
          // Use typed value as new product
          handleSelectOption(null);
        } else if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          // Select existing product
          handleSelectOption(filteredOptions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When value changes externally (like from form reset), update search
  useEffect(() => {
    setSearch(value);
  }, [value]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm",
            "placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Option to use typed text as new product */}
          {search.trim() && (
            <button
              type="button"
              onClick={() => handleSelectOption(null)}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-50",
                selectedIndex === -1 && "bg-blue-50"
              )}
              onMouseEnter={() => setSelectedIndex(-1)}
            >
              <Plus className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="font-medium">Utiliser "{search}"</div>
                <div className="text-xs text-gray-500">Créer comme nouveau produit</div>
              </div>
            </button>
          )}

          {/* Existing products */}
          {filteredOptions.map((option, index) => (
            <button
              key={option.productId}
              type="button"
              onClick={() => handleSelectOption(option)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50",
                selectedIndex === index && "bg-blue-50",
                index > 0 || search.trim() ? "border-t border-gray-100" : ""
              )}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-2">
                <Check
                  className={cn(
                    "h-4 w-4",
                    value === option.name ? "text-blue-600 opacity-100" : "opacity-0"
                  )}
                />
                <div className="text-left">
                  <div className="font-medium">{option.name}</div>
                  <div className="text-xs text-gray-500">
                    {option.unitPrice.toLocaleString()} Fcs • Stock: {option.stock}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {filteredOptions.length === 0 && search.trim() && (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              Tapez Entrée pour créer "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}