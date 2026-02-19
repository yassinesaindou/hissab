"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface QuickActionsButtonProps {
  onNewTransaction: () => void;
}

export default function QuickActionsButton({ onNewTransaction }: QuickActionsButtonProps) {
  return (
    <Button 
      onClick={onNewTransaction}
      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
    >
      <Plus className="h-4 w-4 mr-2" />
      Nouvelle Vente
    </Button>
  );
}