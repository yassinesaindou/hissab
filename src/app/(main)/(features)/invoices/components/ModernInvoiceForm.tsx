/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/ModernInvoiceForm.tsx - MOBILE RESPONSIVE VERSION
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
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
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

// Helper function to convert numbers to words (French) - FIXED VERSION
const convertToWords = (num: number): string => {
  if (num === 0) return 'zéro';
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const thousands = ['', 'mille', 'million', 'milliard'];
  
  const convertChunk = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      
      // Special cases for French
      if (ten === 7 || ten === 9) {
        const base = tens[ten - 1];
        if (unit === 0) return base + '-dix';
        if (unit === 1 && ten === 7) return base + '-et-onze';
        if (unit === 1 && ten === 9) return base + '-onze';
        return base + '-' + (unit < 10 ? teens[unit] : units[unit]);
      }
      
      if (unit === 0) return tens[ten];
      if (unit === 1 && ten === 1) return 'onze';
      if (unit === 1 && (ten === 2 || ten === 3 || ten === 4 || ten === 5 || ten === 6)) {
        return tens[ten] + '-et-' + units[unit];
      }
      return tens[ten] + '-' + units[unit];
    }
    
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let result = hundred === 1 ? 'cent' : units[hundred] + ' cent';
    if (hundred > 1 && rest === 0) result += 's';
    if (rest > 0) result += ' ' + convertChunk(rest);
    return result;
  };
  
  // Handle decimal numbers
  const integerPart = Math.floor(num);
  
  if (integerPart < 1000) {
    return convertChunk(integerPart);
  }
  
  // For numbers >= 1000
  let result = '';
  let chunkIndex = 0;
  let remaining = integerPart;
  
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = convertChunk(chunk);
      if (chunkIndex === 1) { // thousands
        result = (chunk === 1 ? 'mille' : chunkWords + ' mille') + (result ? ' ' + result : '');
      } else if (chunkIndex > 1) {
        result = chunkWords + ' ' + thousands[chunkIndex] + (chunk > 1 ? 's' : '') + (result ? ' ' + result : '');
      } else {
        result = chunkWords + (result ? ' ' + result : '');
      }
    }
    remaining = Math.floor(remaining / 1000);
    chunkIndex++;
  }
  
  return result.trim();
};

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
  
  // Check if client info is provided
  const hasClientInfo = data.clientName || data.clientPhone || data.clientEmail || data.clientAddress;
  
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
        <View style={{ flexDirection: 'row', justifyContent: hasClientInfo ? 'space-between' : 'flex-start', marginBottom: 25 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Émetteur</Text>
            <Text style={styles.text}>{data.storeName}</Text>
            <Text style={styles.text}>{data.storeAddress}</Text>
            {storePhoneNumber && <Text style={styles.text}>{storePhoneNumber}</Text>}
          </View>
          
          {hasClientInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client</Text>
              {data.clientName && <Text style={styles.text}>{data.clientName}</Text>}
              {data.clientPhone && <Text style={styles.text}>{data.clientPhone}</Text>}
              {data.clientEmail && <Text style={styles.text}>{data.clientEmail}</Text>}
              {data.clientAddress && <Text style={styles.text}>{data.clientAddress}</Text>}
            </View>
          )}
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

export default function ModernInvoiceForm({ 
  products = [], 
  storeAddress = "", 
  storeName = "", 
  storePhoneNumber = "" 
}: ModernInvoiceFormProps) {
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<FormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);

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
        clientName: data.clientName || undefined,
        clientPhone: data.clientPhone || undefined,
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
        setInvoiceCreated(true);
        // Don't auto-reset - let user manually start new transaction
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Nouvelle Facture</h2>
            <p className="text-sm sm:text-base text-gray-500">Remplissez les détails ci-dessous</p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 w-fit">
            <FileText className="h-3 w-3 mr-1" />
            Facture #{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
          </Badge>
        </div>

        {/* Client & Store Info - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Client Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Informations Client</h3>
            </div>
            
            <div className="space-y-4">
              <FormField 
                control={form.control} 
                name="clientName" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nom du Client</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="h-10 sm:h-11" />
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
                    <FormLabel className="text-sm font-medium">Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+269 485 78 96" {...field} className="h-10 sm:h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField 
                  control={form.control} 
                  name="clientEmail" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="client@email.com" type="email" {...field} className="h-10 sm:h-11" />
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
                        <Input placeholder="Adresse du client" {...field} className="h-10 sm:h-11" />
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
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Informations Magasin</h3>
            </div>
            
            <div className="space-y-4">
              <FormField 
                control={form.control} 
                name="storeName" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nom du Magasin *</FormLabel>
                    <FormControl>
                      <Input defaultValue={storeName} {...field} className="h-10 sm:h-11" />
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
                      <Input defaultValue={storeAddress} {...field} className="h-10 sm:h-11" />
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
                      <Input defaultValue={storePhoneNumber} placeholder="Téléphone du magasin" {...field} className="h-10 sm:h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Products Section - Mobile Responsive */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Articles</h3>
            </div>
            <Badge variant="outline" className="text-gray-600 w-fit">
              {fields.length} article{fields.length > 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Products - Desktop Table View (hidden on mobile) */}
          <div className="hidden lg:block border border-gray-200 rounded-lg overflow-hidden">
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
                                    form.setValue(`products.${index}.name`, selectedProduct.name);
                                    form.setValue(`products.${index}.unitPrice`, selectedProduct.unitPrice);
                                  } else {
                                    form.setValue(`products.${index}.productId`, "");
                                  }
                                }}
                                onCustomProduct={(productName) => {
                                  form.setValue(`products.${index}.name`, productName);
                                  form.setValue(`products.${index}.unitPrice`, 0);
                                  form.setValue(`products.${index}.productId`, "");
                                }}
                                placeholder="Sélectionner ou créer un produit"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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

                    {/* Price Field */}
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

          {/* Products - Mobile Card View (visible only on mobile) */}
          <div className="lg:hidden space-y-4">
            {fields.map((field, index) => {
              const lineTotal = (watchProducts[index]?.unitPrice || 0) * (watchProducts[index]?.quantity || 1);
              
              return (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Article #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Product Selection */}
                  <FormField
                    control={form.control}
                    name={`products.${index}.productId`}
                    render={({ field: productIdField }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Produit</FormLabel>
                        <FormControl>
                          <ProductCombobox
                            products={products}
                            value={productIdField.value || ""}
                            onChange={(productId, selectedProduct) => {
                              productIdField.onChange(productId);
                              if (selectedProduct) {
                                form.setValue(`products.${index}.name`, selectedProduct.name);
                                form.setValue(`products.${index}.unitPrice`, selectedProduct.unitPrice);
                              } else {
                                form.setValue(`products.${index}.productId`, "");
                              }
                            }}
                            onCustomProduct={(productName) => {
                              form.setValue(`products.${index}.name`, productName);
                              form.setValue(`products.${index}.unitPrice`, 0);
                              form.setValue(`products.${index}.productId`, "");
                            }}
                            placeholder="Sélectionner ou créer un produit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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

                  <div className="grid grid-cols-2 gap-4">
                    {/* Price Field */}
                    <FormField
                      control={form.control}
                      name={`products.${index}.unitPrice`}
                      render={({ field }) => {
                        const productId = form.watch(`products.${index}.productId`);
                        const isExistingProduct = !!productId;
                        
                        return (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Prix Unitaire</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                  Fcs
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  className={cn(
                                    "pl-10 h-10",
                                    isExistingProduct && "bg-gray-100 text-gray-700"
                                  )}
                                  readOnly={isExistingProduct}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                                {isExistingProduct && (
                                  <div className="absolute -bottom-5 left-0 text-xs text-blue-600">
                                    Auto
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name={`products.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Quantité</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              className="h-10 text-center"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Line Total */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="text-lg font-semibold text-emerald-600">
                        {lineTotal.toLocaleString()} Fcs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Product Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ name: "", unitPrice: 0, quantity: 1 })}
            className="w-full border-dashed h-10 sm:h-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un article
          </Button>
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notes (Optionnel)</h3>
          <FormField 
            control={form.control} 
            name="notes" 
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Remarques additionnelles pour la facture..."
                    {...field}
                    className="min-h-[80px] sm:min-h-[100px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>

        {/* Summary Section - Mobile Responsive */}
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-gray-600">Sous-total:</span>
            <span className="text-sm sm:text-base font-semibold">{totalPrice.toLocaleString()} Fcs</span>
          </div>
          
          {taxRate > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-gray-600">Taxe ({taxRate * 100}%):</span>
              <span className="text-sm sm:text-base font-semibold">{taxAmount.toLocaleString()} Fcs</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-base sm:text-lg font-bold text-gray-900">Total:</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-600">{grandTotal.toLocaleString()} Fcs</span>
          </div>
        </div>

        {/* Actions - Mobile Responsive */}
        <div className="flex flex-col gap-4 pt-4 sm:pt-6 border-t">
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

          <div className="flex flex-col sm:flex-row gap-3">
            {!invoiceCreated ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:flex-1 h-11"
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
            ) : (
              <>
                {/* PDF Download Button - shown first when invoice is created */}
                {invoiceData && (
                  <PDFDownloadLink
                    document={<InvoicePDF data={invoiceData} storePhoneNumber={storePhoneNumber} />}
                    fileName={`facture-${invoiceData.clientName || 'client'}-${Date.now()}.pdf`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium h-11 w-full sm:flex-1"
                  >
                    {({ loading }) => (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {loading ? "Génération..." : "Télécharger PDF"}
                      </>
                    )}
                  </PDFDownloadLink>
                )}
                
                {/* New Transaction Button */}
                <Button
                  type="button"
                  onClick={() => {
                    form.reset({
                      clientName: "",
                      clientPhone: "",
                      clientEmail: "",
                      clientAddress: "",
                      storeName: storeName || "",
                      storeAddress: storeAddress || "",
                      storePhoneNumber: storePhoneNumber || "",
                      notes: "",
                      products: [{ name: "", unitPrice: 0, quantity: 1 }],
                    });
                    setInvoiceCreated(false);
                    setInvoiceData(null);
                    setSubmitMessage("");
                  }}
                  variant="outline"
                  className="w-full sm:w-auto h-11"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Transaction
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}