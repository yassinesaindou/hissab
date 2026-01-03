/* eslint-disable react/no-unescaped-entities */
// app/archives/components/DeleteArchiveModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

type ArchiveFile = {
  archiveId: string;
  fileName: string;
  filePath: string;
  store?: {
    storeName: string;
  };
};

interface DeleteArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archive: ArchiveFile;
  onConfirm: () => void;
}

export default function DeleteArchiveModal({
  isOpen,
  onClose,
  archive,
  onConfirm,
}: DeleteArchiveModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Supprimer l'archive
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Le fichier sera définitivement supprimé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="space-y-2">
              <p className="font-medium text-gray-900">Fichier:</p>
              <p className="text-sm text-gray-700">{archive.fileName}</p>
              
              <p className="font-medium text-gray-900 mt-3">Magasin:</p>
              <p className="text-sm text-gray-700">{archive.store?.storeName || 'N/A'}</p>
              
              <p className="font-medium text-gray-900 mt-3">URL:</p>
              <p className="text-sm text-gray-700 break-all">{archive.filePath}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-700">
              ⚠️ Cette suppression affectera les rapports historiques et ne peut pas être annulée.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}