/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/ModernInvoiceForm.tsx - UPDATED VERSION
"use client";

import { useState } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
 
import { Download, Plus, Trash2, FileText, User, Store, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProductCombobox from "./ProductCombobox";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { createInvoice } from "../actions/action";
import { createInvoiceOfflineFirst } from "@/lib/offline/createInvoiceOfflineFirst";

// Validation schemas
const productSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Le nom du produit est obligatoire"),
  unitPrice: z.coerce.number().min(0, "Le prix unitaire doit être positif ou nul"),
  quantity: z.coerce.number().min(1, "La quantité doit être au moins de 1"),
});

const formSchema = z.object({
  clientName: z.string().min(1, "Le nom du client est obligatoire"),
  clientPhone: z.string().min(1, "Le téléphone du client est obligatoire"),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientAddress: z.string().optional(),
  storeName: z.string().min(1, "Le nom du magasin est obligatoire"),
  storeAddress: z.string().min(1, "L'adresse du magasin est obligatoire"),
  storePhoneNumber: z.string().optional(),
  notes: z.string().optional(),
  products: z.array(productSchema).min(1, "Au moins un produit est requis"),
});

type FormValues = z.infer<typeof formSchema>;

interface Product { 
  productId: string; 
  name: string; 
  unitPrice: number; 
  stock: number; 
}

interface ModernInvoiceFormProps {
  storeName?: string;
  storeAddress?: string;
  storePhoneNumber?: string;
  products: Product[];
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5,
  },
  text: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  totalSection: {
    marginTop: 30,
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#6B7280',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
});

// PDF Document Component
const InvoicePDF = ({ data, storePhoneNumber }: { data: FormValues; storePhoneNumber?: string }) => {
  const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
  const invoiceDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const total = data.products.reduce((sum, product) => sum + (product.unitPrice * product.quantity), 0);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FACTURE</Text>
          <Text style={styles.invoiceNumber}>N° {invoiceNumber}</Text>
          <Text style={styles.invoiceNumber}>Date: {invoiceDate}</Text>
        </View>

        {/* Store and Client Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Émetteur</Text>
            <Text style={styles.text}>{data.storeName}</Text>
            <Text style={styles.text}>{data.storeAddress}</Text>
            {storePhoneNumber && <Text style={styles.text}>{storePhoneNumber}</Text>}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.text}>{data.clientName}</Text>
            <Text style={styles.text}>{data.clientPhone}</Text>
            {data.clientEmail && <Text style={styles.text}>{data.clientEmail}</Text>}
            {data.clientAddress && <Text style={styles.text}>{data.clientAddress}</Text>}
          </View>
        </View>

        {/* Products Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la Facture</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Description</Text>
              <Text style={styles.tableCell}>Prix Unitaire</Text>
              <Text style={styles.tableCell}>Quantité</Text>
              <Text style={[styles.tableCell, styles.tableCellLast]}>Total</Text>
            </View>
            
            {/* Table Rows */}
            {data.products.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{product.name}</Text>
                <Text style={styles.tableCell}>{product.unitPrice.toFixed(2)} Fcs</Text>
                <Text style={styles.tableCell}>{product.quantity}</Text>
                <Text style={[styles.tableCell, styles.tableCellLast]}>
                  {(product.unitPrice * product.quantity).toFixed(2)} Fcs
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.text}>{data.notes}</Text>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)} Fcs</Text>
          <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 5 }}>
            Montant en lettres: {convertToWords(total)} francs comoriens
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Merci de votre confiance !</Text>
          <Text>Ce document a une valeur légale et doit être conservé.</Text>
          <Text>Pour toute question, contactez-nous au {storePhoneNumber || "numéro du magasin"}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Helper function to convert numbers to words (French)
const convertToWords = (num: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (num === 0) return 'zéro';
  if (num < 10) return units[num];
  if (num < 20) {
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    return teens[num - 10];
  }
  
  // For simplicity, just return the number
  return num.toString();
};

export default function ModernInvoiceForm({ 
  products = [], 
  storeAddress = "", 
  storeName = "", 
  storePhoneNumber = "" 
}: ModernInvoiceFormProps) {
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<FormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      clientAddress: "",
      storeName: storeName || "",
      storeAddress: storeAddress || "",
      storePhoneNumber: storePhoneNumber || "",
      notes: "",
      products: [{ name: "", unitPrice: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ 
    control: form.control, 
    name: "products" 
  });

  const watchProducts = form.watch("products");
  const totalPrice = watchProducts.reduce((s, p) => s + (p.unitPrice || 0) * (p.quantity || 1), 0);
  const taxRate = 0;
  const taxAmount = totalPrice * taxRate;
  const grandTotal = totalPrice + taxAmount;

  const onSubmit = async (data: FormValues) => {
  setIsSubmitting(true);
  setSubmitMessage("");

  try {
    const result = await createInvoiceOfflineFirst({
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail || undefined,
      clientAddress: data.clientAddress || undefined,
      storeName: data.storeName,
      storeAddress: data.storeAddress,
      storePhoneNumber: data.storePhoneNumber || undefined,
      notes: data.notes || undefined,
      products: data.products.map(p => ({
        productId: p.productId,
        name: p.name,
        unitPrice: p.unitPrice,
        quantity: p.quantity,
      })),
    });

    if (result.success) {
      setSubmitMessage("Facture créée avec succès !");
      setInvoiceData(result.invoiceData);
      // Don't reset form — user might want to print again
    }
  } catch (error: any) {
    setSubmitMessage(error.message || "Une erreur s'est produite");
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nouvelle Facture</h2>
            <p className="text-gray-500">Remplissez les détails ci-dessous</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <FileText className="h-3 w-3 mr-1" />
              Facture #{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
            </Badge>
          </div>
        </div>

        {/* Client & Store Info */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Client Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations Client</h3>
            </div>
            
            <div className="space-y-4">
              <FormField 
                control={form.control} 
                name="clientName" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nom du Client *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="clientPhone" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Téléphone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+269 485 78 96" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField 
                  control={form.control} 
                  name="clientEmail" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="client@email.com" type="email" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />

                <FormField 
                  control={form.control} 
                  name="clientAddress" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="Adresse du client" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
              </div>
            </div>
          </div>

          {/* Store Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations Magasin</h3>
            </div>
            
            <div className="space-y-4">
              <FormField 
                control={form.control} 
                name="storeName" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nom du Magasin *</FormLabel>
                    <FormControl>
                      <Input defaultValue={storeName} {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="storeAddress" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Adresse *</FormLabel>
                    <FormControl>
                      <Input defaultValue={storeAddress} {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="storePhoneNumber" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Téléphone</FormLabel>
                    <FormControl>
                      <Input defaultValue={storePhoneNumber} placeholder="Téléphone du magasin" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Products Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Articles</h3>
            </div>
            <Badge variant="outline" className="text-gray-600">
              {fields.length} article{fields.length > 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Products Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-5">Article</div>
              <div className="col-span-2">Prix Unitaire</div>
              <div className="col-span-2">Quantité</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-gray-100">
              {fields.map((field, index) => {
                const lineTotal = (watchProducts[index]?.unitPrice || 0) * (watchProducts[index]?.quantity || 1);
                
                return (
                  <div key={field.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/50 transition-colors">
                    {/* Product Selection */}
                    <div className="col-span-5">
  <FormField
    control={form.control}
    name={`products.${index}.productId`}
    render={({ field: productIdField }) => (
      <FormItem>
        <FormLabel className="sr-only">Article</FormLabel>
        <FormControl>
          <ProductCombobox
            products={products}
            value={productIdField.value || ""}
            onChange={(productId, selectedProduct) => {
              productIdField.onChange(productId);
              if (selectedProduct) {
                // AUTO-SET PRICE when selecting existing product
                form.setValue(`products.${index}.name`, selectedProduct.name);
                form.setValue(`products.${index}.unitPrice`, selectedProduct.unitPrice);
              } else {
                // For custom products (no productId)
                form.setValue(`products.${index}.productId`, "");
              }
            }}
            onCustomProduct={(productName) => {
              // User typed a custom product name
              form.setValue(`products.${index}.name`, productName);
              form.setValue(`products.${index}.unitPrice`, 0); // Reset to 0 for custom
              form.setValue(`products.${index}.productId`, "");
            }}
            placeholder="Sélectionner ou créer un produit"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  
  {/* Hidden fields - UPDATED with better naming */}
  <FormField
    control={form.control}
    name={`products.${index}.name`}
    render={({ field }) => (
      <FormItem className="hidden">
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

{/* Price Field - Now readonly for existing products */}
<div className="col-span-2">
  <FormField
    control={form.control}
    name={`products.${index}.unitPrice`}
    render={({ field }) => {
      const productId = form.watch(`products.${index}.productId`);
      const isExistingProduct = !!productId;
      
      return (
        <FormItem>
          <FormLabel className="sr-only">Prix Unitaire</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                Fcs
              </span>
              <Input
                type="number"
                step="0.01"
                {...field}
                className={cn(
                  "pl-12 h-11",
                  isExistingProduct && "bg-gray-100 text-gray-700"
                )}
                readOnly={isExistingProduct}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
              {isExistingProduct && (
                <div className="absolute -top-6 left-0 text-xs text-blue-600">
                  Prix automatique
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      );
    }}
  />
</div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`products.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Quantité</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                className="h-11 text-center"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Line Total */}
                    <div className="col-span-2">
                      <div className="h-11 flex items-center justify-center font-medium text-emerald-600 bg-emerald-50 rounded-md border border-emerald-100">
                        {lineTotal.toLocaleString()} Fcs
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Product Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ name: "", unitPrice: 0, quantity: 1 })}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un article
          </Button>
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Notes (Optionnel)</h3>
          <FormField 
            control={form.control} 
            name="notes" 
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Remarques additionnelles pour la facture..."
                    {...field}
                    className="min-h-[100px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>

        {/* Summary Section */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Sous-total:</span>
            <span className="font-semibold">{totalPrice.toLocaleString()} Fcs</span>
          </div>
          
          {taxRate > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taxe ({taxRate * 100}%):</span>
              <span className="font-semibold">{taxAmount.toLocaleString()} Fcs</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-emerald-600">{grandTotal.toLocaleString()} Fcs</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <div className="flex-1 space-y-2">
            {submitMessage && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                submitMessage.includes("succès") 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              )}>
                {submitMessage}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Créer Facture
                </>
              )}
            </Button>

            {/* PDF Download Button - Only shown when invoice is created successfully */}
            {invoiceData && submitMessage.includes("succès") && (
              <PDFDownloadLink
                document={<InvoicePDF data={invoiceData} storePhoneNumber={storePhoneNumber} />}
                fileName={`facture-${invoiceData.clientName}-${Date.now()}.pdf`}
                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium min-h-[40px] min-w-[120px]"
              >
                {({ loading }) => (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? "Génération..." : "Télécharger PDF"}
                  </>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}