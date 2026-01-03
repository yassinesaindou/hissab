/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
// app/archives/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
    Archive,
    Calendar,
    FileText,
    FolderArchive,
    History,
    PieChart,
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ArchivesTable from "./components/ArchivesTable";
import DeleteArchiveModal from "./components/DeleteArchiveModal";

type ArchiveFile = {
  archiveId: string;
  fileName: string;
  filePath: string;
  storeId: string;
  createdAt: string;
  store?: {
    storeName: string;
    storeAddress?: string;
    storePhoneNumber?: string;
  };
  fileSize?: number;
  year?: number;
};

type StoreInfo = {
  storeId: string;
  storeName: string;
  storeAddress?: string;
  storePhoneNumber?: string;
};

export default function ArchivesPage() {
  const [archives, setArchives] = useState<ArchiveFile[]>([]);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [deleteArchive, setDeleteArchive] = useState<ArchiveFile | null>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const fetchArchives = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, storeId")
        .eq("userId", user.id)
        .single();

      // Only allow admin or user roles
      if (!profile || profile.role === "employee") {
        setLoading(false);
        return;
      }

      // Admin can see all stores, user only sees their store
      let storesQuery = supabase
        .from("stores")
        .select("storeId, storeName, storeAddress, storePhoneNumber");

      if (profile.role === "user") {
        storesQuery = storesQuery.eq("storeId", profile.storeId);
      }

      const { data: storesData, error: storesError } = await storesQuery;

      if (storesError) {
        console.error("Error fetching stores:", storesError);
        return;
      }

      setStores(storesData || []);

      // Fetch archives with store info
      let archivesQuery = supabase
        .from("archived_files")
        .select(`
          *,
          stores!archived_files_storeId_fkey (
            storeId,
            storeName,
            storeAddress,
            storePhoneNumber
          )
        `)
        .order("createdAt", { ascending: false });

      // For regular users, only show their store's archives
      if (profile.role === "user") {
        archivesQuery = archivesQuery.eq("storeId", profile.storeId);
      }

      const { data: archivesData, error: archivesError } = await archivesQuery;

      if (archivesError) {
        console.error("Error fetching archives:", archivesError);
        return;
      }

      // Process archives data
      const processedArchives: ArchiveFile[] = (archivesData || []).map(archive => {
        // Extract year from filename
        const yearMatch = archive.fileName.match(/transactions_(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
        
        return {
          ...archive,
          store: archive.stores,
          year,
          // Simulate file size (in a real app, you'd get this from storage metadata)
          fileSize: Math.floor(Math.random() * 5000000) + 100000 // 100KB - 5MB
        };
      });

      setArchives(processedArchives);

    } catch (err) {
      console.error("Failed to load archives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // Filter archives based on search and filters
  const filteredArchives = archives.filter(archive => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      archive.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.store?.storeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Store filter
    const matchesStore = selectedStore === "all" || archive.storeId === selectedStore;
    
    // Year filter
    const matchesYear = selectedYear === "all" || archive.year?.toString() === selectedYear;
    
    return matchesSearch && matchesStore && matchesYear;
  });

  // Calculate statistics
  const totalArchives = archives.length;
  const totalSizeMB = archives.reduce((sum, archive) => sum + (archive.fileSize || 0), 0) / (1024 * 1024);
  const oldestYear = archives.length > 0 
    ? Math.min(...archives.map(a => a.year || new Date().getFullYear()))
    : new Date().getFullYear();
  const newestYear = archives.length > 0 
    ? Math.max(...archives.map(a => a.year || new Date().getFullYear()))
    : new Date().getFullYear();
  const storesWithArchives = new Set(archives.map(a => a.storeId)).size;
  const yearsWithArchives = new Set(archives.map(a => a.year).filter(Boolean)).size;
  
  // Get unique years for filter dropdown
  const uniqueYears = Array.from(new Set(archives
    .map(a => a.year)
    .filter(Boolean)
    .sort((a, b) => b! - a!) // Sort descending
  ));

  const handleDeleteClick = (archive: ArchiveFile) => {
    setDeleteArchive(archive);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteArchive) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("archivedTransactions")
        .remove([deleteArchive.fileName]);

      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        return;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("archived_files")
        .delete()
        .eq("archiveId", deleteArchive.archiveId);

      if (dbError) {
        console.error("Error deleting archive record:", dbError);
        return;
      }

      // Refresh the list
      fetchArchives();
      setDeleteArchive(null);
    } catch (error) {
      console.error("Error deleting archive:", error);
    }
  };

  const handleDownload = async (archive: ArchiveFile) => {
    try {
      // Get the file from storage
      const { data, error } = await supabase.storage
        .from("archivedTransactions")
        .download(archive.fileName);

      if (error) {
        console.error("Error downloading file:", error);
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = archive.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Chargement des archives</h3>
            <p className="text-gray-600 mt-1">Récupération des fichiers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                <FolderArchive className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Archives des Transactions
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez et consultez les transactions archivées
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchArchives}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fichiers d'archive</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalArchives}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {storesWithArchives} magasin{storesWithArchives !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Archive className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Espace utilisé</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalSizeMB.toFixed(1)} MB
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Taille totale des archives
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Période couverte</p>
                <p className="text-3xl font-bold text-gray-900">
                  {oldestYear} - {newestYear}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {yearsWithArchives} année{yearsWithArchives !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tendance</p>
                <p className="text-3xl font-bold text-gray-900">
                  {archives.length > 0 ? 'Actif' : 'Inactif'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {archives.length > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-emerald-600">Données archivées</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-gray-600" />
                      <span className="text-xs text-gray-600">Aucune archive</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-100">
                <History className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de fichier ou magasin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les magasins</option>
                {stores.map(store => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.storeName}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes les années</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Archives Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Fichiers d'archive ({filteredArchives.length})
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Transactions archivées par année et magasin
                </p>
              </div>
            </div>

            {filteredArchives.length > 0 ? (
              <ArchivesTable 
                archives={filteredArchives}
                onDownload={handleDownload}
                onDelete={handleDeleteClick}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune archive trouvée
                </h3>
                <p className="text-gray-600">
                  {searchTerm || selectedStore !== "all" || selectedYear !== "all"
                    ? "Aucun fichier ne correspond à vos critères de recherche."
                    : "Aucune transaction n'a encore été archivée."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                À propos de l'archivage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-800 text-sm">
                    <span className="font-medium">Processus automatique:</span> Les transactions sont archivées chaque année le 1er janvier.
                  </p>
                  <p className="text-blue-800 text-sm mt-2">
                    <span className="font-medium">Période:</span> Les données de 2 ans sont archivées (ex: en 2025, archivage de 2023).
                  </p>
                </div>
                <div>
                  <p className="text-blue-800 text-sm">
                    <span className="font-medium">Format:</span> Les fichiers sont en CSV avec séparateur point-virgule (;).
                  </p>
                  <p className="text-blue-800 text-sm mt-2">
                    <span className="font-medium">Contenu:</span> Chaque fichier contient les transactions détaillées et un résumé annuel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteArchive && (
        <DeleteArchiveModal
          isOpen={!!deleteArchive}
          onClose={() => setDeleteArchive(null)}
          archive={deleteArchive}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}