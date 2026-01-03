/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/actions/archiveOldTransactions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function archiveOldTransactions() {
  try {
    const supabase = createSupabaseServerClient();
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Archive transactions from 2 years ago
    const archiveYear = currentYear - 2;
    
    // Check if it's January 1st
    const isJanuaryFirst = today.getMonth() === 0 && today.getDate() === 1;
    
    if (!isJanuaryFirst) {
      // Not January 1st, no action needed
      return {
        success: true,
        message: `Aujourd'hui n'est pas le 1er janvier. Archivage annuel reporté au prochain 1er janvier.`,
        archived: false
      };
    }

    // Check if already archived for this year
    const { data: existingArchives } = await supabase
      .from("archived_files")
      .select("fileName")
      .ilike("fileName", `%transactions_${archiveYear}%`);

    if (existingArchives && existingArchives.length > 0) {
      return {
        success: true,
        message: `Les transactions de ${archiveYear} ont déjà été archivées.`,
        archived: false
      };
    }

    // Get all stores
    const { data: stores, error: storesError } = await supabase
      .from("stores")
      .select("storeId, storeName");

    if (storesError) {
      console.error("Error fetching stores:", storesError);
      return {
        success: false,
        message: "Erreur lors de la récupération des magasins"
      };
    }

    if (!stores || stores.length === 0) {
      return {
        success: true,
        message: "Aucun magasin trouvé",
        archived: false
      };
    }

    // Define date range for archive year
    const startOfArchiveYear = new Date(archiveYear, 0, 1);
    const endOfArchiveYear = new Date(archiveYear, 11, 31, 23, 59, 59, 999);

    let totalArchived = 0;
    let totalFilesCreated = 0;

    // Process each store
    for (const store of stores) {
      console.log(`Archivage pour le magasin: ${store.storeName}`);

      // Fetch transactions from archive year
      const { data: oldTransactions, error: transError } = await supabase
        .from("transactions")
        .select("*")
        .eq("storeId", store.storeId)
        .gte("created_at", startOfArchiveYear.toISOString())
        .lte("created_at", endOfArchiveYear.toISOString());

      if (transError) {
        console.error(`Erreur pour le magasin ${store.storeId}:`, transError);
        continue;
      }

      if (!oldTransactions || oldTransactions.length === 0) {
        console.log(`Aucune transaction pour ${store.storeName} en ${archiveYear}`);
        continue;
      }

      // Calculate totals
      let totalSales = 0;
      let totalExpenses = 0;
      let salesCount = 0;
      let expensesCount = 0;

      // Create CSV content
      const csvRows: string[] = [];
      
      // CSV headers
      const headers = [
        'transactionId',
        'date',
        'type',
        'productName',
        'quantity',
        'unitPrice',
        'totalPrice',
        'description',
        'userId'
      ];
      
      // Escape CSV values properly
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        
        // Check if value contains special characters
        const hasSpecialChars = stringValue.includes(';') || 
                               stringValue.includes('"') || 
                               stringValue.includes('\n') || 
                               stringValue.includes('\r');
        
        if (hasSpecialChars) {
          // Escape double quotes by doubling them
          const escaped = stringValue.replace(/"/g, '""');
          return `"${escaped}"`;
        }
        
        return stringValue;
      };

      // Add headers
      csvRows.push(headers.join(';'));

      // Process each transaction
      for (const transaction of oldTransactions) {
        // Update totals
        if (transaction.type === "sale") {
          totalSales += transaction.totalPrice || 0;
          salesCount++;
        } else if (transaction.type === "expense") {
          totalExpenses += transaction.totalPrice || 0;
          expensesCount++;
        }

        // Add to CSV
        const row = [
          transaction.transactionId,
          transaction.created_at,
          transaction.type,
          transaction.productName || "",
          transaction.quantity || 0,
          transaction.unitPrice || 0,
          transaction.totalPrice || 0,
          transaction.description || "",
          transaction.userId || ""
        ].map(escapeCSV).join(';');
        
        csvRows.push(row);
      }

      // Add summary rows
      const summaryRows = [
        {
          transactionId: 'SUMMARY',
          date: `${archiveYear}-12-31`,
          type: 'summary',
          productName: 'Total des ventes',
          quantity: salesCount,
          unitPrice: 0,
          totalPrice: totalSales,
          description: `Ventes ${archiveYear}`,
          userId: 'system'
        },
        {
          transactionId: 'SUMMARY',
          date: `${archiveYear}-12-31`,
          type: 'summary',
          productName: 'Total des dépenses',
          quantity: expensesCount,
          unitPrice: 0,
          totalPrice: totalExpenses,
          description: `Dépenses ${archiveYear}`,
          userId: 'system'
        },
        {
          transactionId: 'SUMMARY',
          date: `${archiveYear}-12-31`,
          type: 'summary',
          productName: 'Bénéfice net',
          quantity: salesCount + expensesCount,
          unitPrice: 0,
          totalPrice: totalSales - totalExpenses,
          description: `Bénéfice ${archiveYear}`,
          userId: 'system'
        }
      ];

      // Add summary rows to CSV
      for (const summary of summaryRows) {
        const row = [
          summary.transactionId,
          summary.date,
          summary.type,
          summary.productName,
          summary.quantity,
          summary.unitPrice,
          summary.totalPrice,
          summary.description,
          summary.userId
        ].map(escapeCSV).join(';');
        
        csvRows.push(row);
      }

      // Create CSV file
      const csvContent = csvRows.join('\n');
      const csvFileName = `${store.storeId}_transactions_${archiveYear}.csv`;
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("archivedTransactions")
        .upload(csvFileName, csvBlob, {
          contentType: "text/csv"
        });

      if (uploadError) {
        console.error(`Erreur d'upload pour ${store.storeName}:`, uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("archivedTransactions")
        .getPublicUrl(csvFileName);

      // Save record to archived_files table
      const { error: insertError } = await supabase
        .from("archived_files")
        .insert({
          fileName: csvFileName,
          filePath: urlData.publicUrl,
          storeId: store.storeId
        });

      if (insertError) {
        console.error(`Erreur d'insertion pour ${store.storeName}:`, insertError);
        continue;
      }

      // Delete the old transactions
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("storeId", store.storeId)
        .gte("created_at", startOfArchiveYear.toISOString())
        .lte("created_at", endOfArchiveYear.toISOString());

      if (deleteError) {
        console.error(`Erreur de suppression pour ${store.storeName}:`, deleteError);
        continue;
      }

      // Create summary transactions
      const summaryTransactions = [
        {
          userId: "system",
          storeId: store.storeId,
          type: "sale" as const,
          productName: `Ventes ${archiveYear}`,
          totalPrice: totalSales,
          description: `Archives: Total des ventes pour ${archiveYear}`,
          created_at: new Date().toISOString()
        },
        {
          userId: "system",
          storeId: store.storeId,
          type: "expense" as const,
          productName: `Dépenses ${archiveYear}`,
          totalPrice: totalExpenses,
          description: `Archives: Total des dépenses pour ${archiveYear}`,
          created_at: new Date().toISOString()
        }
      ];

      const { error: summaryError } = await supabase
        .from("transactions")
        .insert(summaryTransactions);

      if (summaryError) {
        console.error(`Erreur d'insertion des résumés pour ${store.storeName}:`, summaryError);
      }

      totalArchived += oldTransactions.length;
      totalFilesCreated++;
      
      console.log(`✅ ${oldTransactions.length} transactions archivées pour ${store.storeName}`);
    }

    revalidatePath("/dashboard");
    
    // Log success
    console.log(`🎉 Archivage annuel terminé !`);
    console.log(`📊 Résumé:`);
    console.log(`   • Année archivée: ${archiveYear}`);
    console.log(`   • Transactions archivées: ${totalArchived}`);
    console.log(`   • Fichiers CSV créés: ${totalFilesCreated}`);
    console.log(`   • Magasins traités: ${stores.length}`);

    return {
      success: true,
      message: `Archivage annuel terminé avec succès ! ${totalArchived} transactions de ${archiveYear} ont été archivées pour ${totalFilesCreated} magasin(s).`,
      archived: true,
      stats: {
        totalArchived,
        totalFilesCreated,
        archiveYear,
        totalStores: stores.length
      }
    };

  } catch (error) {
    console.error("❌ Erreur lors de l'archivage annuel:", error);
    
    return {
      success: false,
      message: "Une erreur s'est produite lors de l'archivage annuel",
      archived: false
    };
  }
}