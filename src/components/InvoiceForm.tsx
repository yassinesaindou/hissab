// components/InvoiceForm.tsx
"use client";
import { useState } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createInvoice } from "@/app/actions";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Check, ChevronsUpDown, Plus, Trash2, Download, Calculator, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// FIX: Coerce string → number
const productSchema = z.object({
  productId: z.string().optional(),
  isManual: z.boolean(),
  name: z.string().min(1, "Le nom du produit est obligatoire"),
  unitPrice: z.coerce.number().min(0, "Le prix unitaire doit être positif ou nul"),
  quantity: z.coerce.number().min(1, "La quantité doit être au moins de 1"),
});

const formSchema = z.object({
  clientName: z.string().min(1, "Le nom du client est obligatoire"),
  clientPhone: z.string().min(1, "Le téléphone du client est obligatoire"),
  storeName: z.string().min(1, "Le nom du magasin est obligatoire"),
  storeAddress: z.string().min(1, "L'adresse du magasin est obligatoire"),
  products: z.array(productSchema).min(1, "Au moins un produit est requis"),
});

type FormValues = z.infer<typeof formSchema>;

interface Product { productId: string; name: string; unitPrice: number; }
interface InvoiceFormProps {
  storeName?: string;
  storeAddress?: string;
  storePhoneNumber?: string;
  products: Product[];
}

const printStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#fff" },
  header: { marginBottom: 30, textAlign: "center", borderBottom: "2px solid #10B981" },
  title: { fontSize: 32, fontWeight: "bold", color: "#10B981" },
  date: { fontSize: 11, color: "#6b7280", marginTop: 6 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#1f2937", marginBottom: 10, borderBottom: "1px solid #e5e7eb" },
  text: { fontSize: 12, color: "#4b5563", marginBottom: 6 },
  table: { border: "1px solid #e5e7eb", marginTop: 10 },
  tableHeader: { backgroundColor: "#f3f4f6", flexDirection: "row", borderBottomWidth: 1, borderColor: "#d1d5db" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e7eb" },
  cell: { padding: 12, fontSize: 12, flex: 1, borderRightWidth: 1, borderColor: "#e5e7eb" },
  cellLast: { borderRightWidth: 0 },
  totalSection: { marginTop: 30, alignItems: "flex-end" },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#10B981" },
});

const PDFDocument = ({ data, storePhoneNumber }: { data: FormValues; storePhoneNumber?: string }) => {
  const formatDateIST = () => new Date().toLocaleString("fr-FR", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  const total = data.products.reduce((s, p) => s + p.unitPrice * p.quantity, 0);

  return (
    <Document>
      <Page size="A4" style={printStyles.page}>
        <View style={printStyles.header}>
          <Text style={printStyles.title}>FACTURE</Text>
          <Text style={printStyles.date}>{formatDateIST()}</Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={printStyles.section}>
            <Text style={printStyles.sectionTitle}>Magasin</Text>
            <Text style={printStyles.text}>{data.storeName}</Text>
            <Text style={printStyles.text}>{data.storeAddress}</Text>
            {storePhoneNumber && <Text style={printStyles.text}>{storePhoneNumber}</Text>}
          </View>
          <View style={printStyles.section}>
            <Text style={printStyles.sectionTitle}>Client</Text>
            <Text style={printStyles.text}>{data.clientName}</Text>
            <Text style={printStyles.text}>{data.clientPhone}</Text>
          </View>
        </View>

        <View style={printStyles.section}>
          <Text style={printStyles.sectionTitle}>Articles</Text>
          <View style={printStyles.table}>
            <View style={printStyles.tableHeader}>
              <Text style={[printStyles.cell, { flex: 2 }]}>Article</Text>
              <Text style={printStyles.cell}>Prix</Text>
              <Text style={printStyles.cell}>Qté</Text>
              <Text style={[printStyles.cell, printStyles.cellLast]}>Total</Text>
            </View>
            {data.products.map((p, i) => (
              <View key={i} style={printStyles.tableRow}>
                <Text style={[printStyles.cell, { flex: 2 }]}>{p.name}</Text>
                <Text style={printStyles.cell}>{p.unitPrice.toFixed(2)}</Text>
                <Text style={printStyles.cell}>{p.quantity}</Text>
                <Text style={[printStyles.cell, printStyles.cellLast]}>{(p.unitPrice * p.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={printStyles.totalSection}>
          <Text style={printStyles.totalLabel}>Total à payer :</Text>
          <Text style={printStyles.totalValue}>{total.toFixed(2)} KMF</Text>
        </View>
      </Page>
    </Document>
  );
};

export default function InvoiceForm({ products, storeAddress, storeName, storePhoneNumber }: InvoiceFormProps) {
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<FormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "", clientPhone: "",
      storeName: storeName || "", storeAddress: storeAddress || "",
      products: [{ isManual: false, name: "", unitPrice: 0, quantity: 1, productId: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "products" });
  const watchProducts = form.watch("products");
  const totalPrice = watchProducts.reduce((s, p) => s + (p.unitPrice || 0) * (p.quantity || 1), 0);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const result = await createInvoice(data);
    setSubmitMessage(result.message);
    if (result.success) {
      setInvoiceData(data);
      form.reset();
    }
    setIsSubmitting(false);
  };

  const formatDateIST = () => new Date().toLocaleString("fr-FR", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="relative">
      {/* FORM */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100 print:hidden">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* CLIENT & STORE */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-10">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-blue-700 mb-4">Client</h3>
                    <div className="space-y-4">
                      <FormField control={form.control} name="clientName" render={({ field }) => (
                        <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="clientPhone" render={({ field }) => (
                        <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="+269 485 78 96" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-indigo-700 mb-4">Magasin</h3>
                    <div className="space-y-4">
                      <FormField control={form.control} name="storeName" render={({ field }) => (
                        <FormItem><FormLabel>Nom</FormLabel><FormControl><Input defaultValue={storeName} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="storeAddress" render={({ field }) => (
                        <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input defaultValue={storeAddress} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PRODUCTS */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Articles</h3>

                {fields.map((field, i) => (
                  <div key={field.id} className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="grid md:grid-cols-12 gap-4 items-end">
                      {/* Type */}
                      <div className="md:col-span-2">
                        <FormField control={form.control} name={`products.${i}.isManual`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                  {field.value ? "Manuel" : "Stock"} <ChevronsUpDown className="ml-2 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandList>
                                    <CommandItem onSelect={() => form.setValue(`products.${i}.isManual`, false)}>Stock</CommandItem>
                                    <CommandItem onSelect={() => form.setValue(`products.${i}.isManual`, true)}>Manuel</CommandItem>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )} />
                      </div>

                      {/* Product Name */}
                      {form.watch(`products.${i}.isManual`) ? (
                        <div className="md:col-span-4">
                          <FormField control={form.control} name={`products.${i}.name`} render={({ field }) => (
                            <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Ciment, Clou..." {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      ) : (
                        <div className="md:col-span-4">
                          <FormField control={form.control} name={`products.${i}.productId`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Article</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between text-left">
                                    {field.value ? products.find(p => p.productId === field.value)?.name : "Choisir"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                  <Command>
                                    <CommandInput placeholder="Rechercher..." />
                                    <CommandList>
                                      <CommandEmpty>Aucun.</CommandEmpty>
                                      <CommandGroup>
                                        {products.map(p => (
                                          <CommandItem key={p.productId} onSelect={() => {
                                            field.onChange(p.productId);
                                            form.setValue(`products.${i}.name`, p.name);
                                            form.setValue(`products.${i}.unitPrice`, p.unitPrice);
                                          }}>
                                            <Check className={cn("mr-2 h-4 w-4", field.value === p.productId ? "opacity-100" : "opacity-0")} />
                                            {p.name} ({p.unitPrice} KMF)
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      )}

                      {/* Price — FIXED: z.coerce.number() */}
                      <div className="md:col-span-2">
                        <FormField control={form.control} name={`products.${i}.unitPrice`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prix</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                readOnly={!form.watch(`products.${i}.isManual`)}
                                className={cn(!form.watch(`products.${i}.isManual`) && "bg-gray-100")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <FormField control={form.control} name={`products.${i}.quantity`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qté</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      {/* Remove */}
                      <div className="md:col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length === 1}>
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* AJOUTER BUTTON BELOW */}
                    {i === fields.length - 1 && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          type="button"
                          onClick={() => append({ isManual: false, name: "", unitPrice: 0, quantity: 1, productId: "" })}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <Plus className="mr-2 h-5 w-5" /> Ajouter un article
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TOTAL ON LEFT */}
            <div className="flex justify-between items-center">
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 rounded-xl shadow-md">
                <p className="text-sm font-medium">Total à payer</p>
                <p className="text-2xl font-bold">{totalPrice.toFixed(2)} KMF</p>
              </div>

              {/* BUTTONS — HIDDEN IN PRINT */}
              <div className="print:hidden flex gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  <Calculator className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Création..." : "Créer"}
                </Button>

                {submitMessage.includes("success") && invoiceData && (
                  <>
                    <PDFDownloadLink
                      document={<PDFDocument data={invoiceData} storePhoneNumber={storePhoneNumber} />}
                      fileName={`facture-${invoiceData.clientName}.pdf`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                    >
                      {({ loading }) => (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          {loading ? "Préparation..." : "PDF"}
                        </>
                      )}
                    </PDFDownloadLink>
                    <Button onClick={() => window.print()} className="bg-purple-600 hover:bg-purple-700">
                      <Printer className="mr-2 h-5 w-5" /> Imprimer
                    </Button>
                  </>
                )}
              </div>
            </div>

            {submitMessage && (
              <p className={`text-center text-sm ${submitMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {submitMessage}
              </p>
            )}
          </form>
        </FormProvider>
      </div>

      {/* PRINT PREVIEW — NO BUTTONS */}
      {invoiceData && (
        <div className="print-only hidden print:block p-10 bg-white max-w-[210mm] mx-auto">
          <div className="text-center mb-8 pb-4 border-b-2 border-green-500">
            <h1 className="text-4xl font-bold text-green-600">FACTURE</h1>
            <p className="text-sm text-gray-600 mt-2">{formatDateIST()}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Magasin</h2>
              <p className="text-sm text-gray-700">{invoiceData.storeName}</p>
              <p className="text-sm text-gray-700">{invoiceData.storeAddress}</p>
              {storePhoneNumber && <p className="text-sm text-gray-700">{storePhoneNumber}</p>}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Client</h2>
              <p className="text-sm text-gray-700">{invoiceData.clientName}</p>
              <p className="text-sm text-gray-700">{invoiceData.clientPhone}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Articles</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left text-sm font-bold">Article</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-bold">Prix</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-bold">Qté</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.products.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 text-sm">{p.name}</td>
                    <td className="border border-gray-300 p-3 text-sm">{p.unitPrice.toFixed(2)}</td>
                    <td className="border border-gray-300 p-3 text-sm">{p.quantity}</td>
                    <td className="border border-gray-300 p-3 text-sm">{(p.unitPrice * p.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-green-600">
              Total à payer : {(invoiceData.products.reduce((s, p) => s + p.unitPrice * p.quantity, 0)).toFixed(2)} KMF
            </p>
          </div>
        </div>
      )}
    </div>
  );
}