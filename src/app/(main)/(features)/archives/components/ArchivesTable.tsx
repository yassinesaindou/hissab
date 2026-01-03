/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
// app/archives/components/ArchivesTable.tsx
"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { Calendar, Download, FileText, Store, Trash2 } from "lucide-react";

type ArchiveFile = {
  archiveId: string;
  fileName: string;
  filePath: string;
  storeId: string;
  createdAt: string;
  store?: {
    storeName: string;
  };
  fileSize?: number;
  year?: number;
};

interface ArchivesTableProps {
  archives: ArchiveFile[];
  onDownload: (archive: ArchiveFile) => void;
  onDelete: (archive: ArchiveFile) => void;
}

export default function ArchivesTable({ archives, onDownload, onDelete }: ArchivesTableProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getYearFromFilename = (filename: string): string => {
    const match = filename.match(/transactions_(\d{4})/);
    return match ? match[1] : 'N/A';
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fichier
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Magasin
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Année
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date d'archivage
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Taille
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {archives.map((archive) => (
            <tr key={archive.archiveId} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{archive.fileName}</p>
                    <a 
                      href={archive.filePath} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {archive.filePath.split('/').pop()}
                    </a>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{archive.store?.storeName || 'Magasin'}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{getYearFromFilename(archive.fileName)}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-gray-900">
                  {format(new Date(archive.createdAt), "dd MMM yyyy", { locale: fr })}
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(archive.createdAt), "HH:mm", { locale: fr })}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {archive.fileSize ? formatFileSize(archive.fileSize) : 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {/* <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(archive)}
                    className="gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Télécharger
                  </Button> */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(archive.filePath, '_blank')}
                    className="gap-2"
                  >
                     <Download className="h-3 w-3" />
                    Télécharger
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(archive)}
                    className="gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    Supprimer
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}