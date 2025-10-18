"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createInvoice } from "@/app/actions";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const productSchema = z.object({
  productId: z.string().optional(),
  isManual: z.boolean(),
  name: z.string().min(1, "Le nom du produit est obligatoire"),
  unitPrice: z.number().min(0, "Le prix unitaire doit être positif ou nul"),
  quantity: z.number().min(1, "La quantité doit être au moins de 1"),
});

const formSchema = z.object({
  clientName: z.string().min(1, "Le nom du client est obligatoire"),
  clientPhone: z.string().min(1, "Le téléphone du client est obligatoire"),
  storeName: z.string().min(1, "Le nom du magasin est obligatoire"),
  storeAddress: z.string().min(1, "L'adresse du magasin est obligatoire"),
  products: z.array(productSchema).min(1, "Au moins un produit est requis"),
});

type FormValues = z.infer<typeof formSchema>;

interface Product {
  productId: string;
  name: string;
  unitPrice: number;
}

interface InvoiceFormProps {
  storeName?: string;
  storeAddress?: string;
  storePhoneNumber?: string;
  products: Product[];
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 12,
    backgroundColor: "#FFFFFF",
  },
  container: {
    border: "1px solid #10B981", // Green-500
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "semibold",
    color: "#151616", // Gray-800
  },
  date: {
    fontSize: 10,
    color: "#121212", // Gray-600
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "semibold",
    color: "#191919", // Gray-700
    marginBottom: 8,
  },
  text: {
    fontSize: 10,
    color: "#1d1d1d", // Gray-600
    marginBottom: 4,
  },
  table: {
    border: "1px solid #D1D5DB", // Gray-300
    marginBottom: 20,
  },
  tableHeader: {
    backgroundColor: "#f2f2f2", // Gray-100
    flexDirection: "row",
    borderBottom: "1px solid #D1D5DB",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #262626",
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
    color: "#212121",
    flex: 1,
    borderRight: "1px solid #D1D5DB",
  },
  tableCellLast: {
    borderRight: "none",
  },
  total: {
    fontSize: 14,
    fontWeight: "semibold",
    color: "#111111",
    textAlign: "right",
  },
  sections: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
  },
});

// PDF Document Component
const PDFDocument = ({ data, storePhoneNumber }: { data: FormValues; storePhoneNumber?: string }) => {
  const formatDateIST = () =>
    new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

  const total = data.products.reduce(
    (sum, product) => sum + product.unitPrice * product.quantity,
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Facture</Text>
            <Text style={styles.date}>Date: {formatDateIST()}</Text>
          </View>
          <View style={styles.sections}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations du magasin</Text>
              <Text style={styles.text}>{data.storeName}</Text>
              <Text style={styles.text}>{data.storeAddress}</Text>
              {storePhoneNumber && <Text style={styles.text}>{storePhoneNumber}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations du client</Text>
              <Text style={styles.text}>{data.clientName}</Text>
              <Text style={styles.text}>{data.clientPhone}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Articles</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Article</Text>
                <Text style={styles.tableCell}>Prix Unitaire</Text>
                <Text style={styles.tableCell}>Quantité</Text>
                <Text style={[styles.tableCell, styles.tableCellLast]}>
                  Sous total
                </Text>
              </View>
              {data.products.map((product, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {product.name}
                  </Text>
                  <Text style={styles.tableCell}>
                    ${product.unitPrice.toFixed(2)}
                  </Text>
                  <Text style={styles.tableCell}>{product.quantity}</Text>
                  <Text style={[styles.tableCell, styles.tableCellLast]}>
                    ${(product.unitPrice * product.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default function InvoiceForm({ products, storeAddress, storeName, storePhoneNumber }: InvoiceFormProps) {
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<FormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log(storeName, storeAddress);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      storeName: storeName || "",
      storeAddress: storeAddress || "",
      products: [
        { isManual: false, name: "", unitPrice: 0, quantity: 1, productId: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  useEffect(() => {
    setTotalPrice(null);
  }, [fields]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    console.log("Form submitted:", data);
    const result = await createInvoice(data);
    setSubmitMessage(result.message);
    if (result.success) {
      setInvoiceData(data);
      form.reset();
      setTotalPrice(null);
    }
    setIsSubmitting(false);
  };

  const calculateTotal = () => {
    const values = form.getValues();
    console.log("Form values for calculation:", values);
    const total = values.products.reduce((sum, product) => {
      const unitPrice = Number(product.unitPrice) || 0;
      const quantity = Number(product.quantity) || 0;
      console.log(
        `Product ${product.name}: unitPrice=${unitPrice}, quantity=${quantity}, subtotal=${unitPrice * quantity}`
      );
      return sum + unitPrice * quantity;
    }, 0);
    console.log("Calculated total:", total);
    setTotalPrice(total);
  };

  const formatDateIST = () =>
    new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="relative">
      {/* Form Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 print:hidden">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Store/Client Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">
                Informations du magasin et du client
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du client</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                      <FormLabel>Numéro de téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+269 485 78 96" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du magasin</FormLabel>
                      <FormControl>
                        <Input placeholder="Magasin John" defaultValue={storeName} {...field} />
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
                      <FormLabel>Adresse du magasin</FormLabel>
                      <FormControl>
                        <Input placeholder="Mutsamudu, M'roni" defaultValue={storeAddress} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Products */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Articles</h2>

              <div className="space-y-5">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-5 rounded-2xl border border-gray-200 shadow-sm bg-white space-y-4 transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-end gap-4">
                      {/* Type Selector */}
                      <FormField
                        control={form.control}
                        name={`products.${index}.isManual`}
                        render={({ field }) => (
                          <FormItem className="min-w-[180px]">
                            <FormLabel>Type</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-[180px] justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? "Saisir manuellement" : "Choisir un article"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[180px] p-0">
                                <Command>
                                  <CommandList>
                                    <CommandGroup>
                                      <CommandItem
                                        value="select"
                                        onSelect={() => {
                                          form.setValue(`products.${index}.isManual`, false);
                                          form.setValue(`products.${index}.productId`, "");
                                          form.setValue(`products.${index}.name`, "");
                                          form.setValue(`products.${index}.unitPrice`, 0);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            !field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        Choisir un article
                                      </CommandItem>
                                      <CommandItem
                                        value="manual"
                                        onSelect={() => {
                                          form.setValue(`products.${index}.isManual`, true);
                                          form.setValue(`products.${index}.productId`, "");
                                          form.setValue(`products.${index}.name`, "");
                                          form.setValue(`products.${index}.unitPrice`, 0);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        Saisir manuellement
                                      </CommandItem>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Conditional Inputs */}
                      {form.watch(`products.${index}.isManual`) ? (
                        <>
                          <FormField
                            control={form.control}
                            name={`products.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1 min-w-[220px]">
                                <FormLabel>Nom de l&apos;article</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Clou, planche, ciment..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`products.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem className="w-32">
                                <FormLabel>Prix Unitaire</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : (
                        <>
                          <FormField
                            control={form.control}
                            name={`products.${index}.productId`}
                            render={({ field }) => (
                              <FormItem className="flex-1 min-w-[220px]">
                                <FormLabel>Article</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value
                                          ? products.find((p) => p.productId === field.value)?.name ||
                                            "Choisir un article"
                                          : "Choisir un article"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Rechercher un article..." />
                                      <CommandList>
                                        <CommandEmpty>Aucun article trouvé.</CommandEmpty>
                                        <CommandGroup>
                                          {products.map((product) => (
                                            <CommandItem
                                              key={product.productId}
                                              value={`${product.name} (${product.unitPrice} KMF)`} // Use name for search
                                              onSelect={() => {
                                                field.onChange(product.productId);
                                                form.setValue(`products.${index}.name`, product.name);
                                                form.setValue(`products.${index}.unitPrice`, product.unitPrice);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === product.productId ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              {product.name} ({product.unitPrice} KMF)
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`products.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem className="w-32">
                                <FormLabel>Prix Unitaire</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    value={field.value || ""}
                                    readOnly
                                    className="bg-gray-100 text-gray-600"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      {/* Quantity */}
                      <FormField
                        control={form.control}
                        name={`products.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormLabel>Quantité</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                value={field.value || 1}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="mt-6"
                      >
                        Rétirer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Button at Bottom */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between w-full">
                <Button
                  type="button"
                  className="bg-blue-600 max-w-fit hover:bg-blue-700 text-white"
                  onClick={() =>
                    append({
                      isManual: false,
                      name: "",
                      unitPrice: 0,
                      quantity: 1,
                      productId: "",
                    })
                  }
                >
                  + Ajouter un article
                </Button>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center">
              <Button type="button" onClick={calculateTotal}>
                Calculer le total
              </Button>
              {totalPrice !== null && (
                <p className="text-lg font-semibold text-gray-600">
                  Total: $
                  {totalPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            {/* Submit and Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-gray-100"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "En cours..." : "Créer la facture"}
              </Button>
              {submitMessage.includes("success") && invoiceData && (
                <PDFDownloadLink
                  document={<PDFDocument storePhoneNumber={storePhoneNumber} data={invoiceData} />}
                  fileName={`invoice ${invoiceData.clientName}.pdf`}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-gray-100 rounded-md text-sm font-medium"
                >
                  {({ loading }) => (loading ? "Téléchargement..." : "Télécharger le PDF")}
                </PDFDownloadLink>
              )}
            </div>
            {submitMessage && (
              <p
                className={`text-sm ${
                  submitMessage.includes("success") ? "text-green-600" : "text-red-600"
                }`}
              >
                {submitMessage}
              </p>
            )}
          </form>
        </FormProvider>
      </div>

      {/* Printable Invoice Section */}
      {invoiceData && (
        <div className="print-only hidden print:block p-6 bg-white border border-green-100 max-w-[210mm] mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Invoice</h1>
            <p className="text-sm text-gray-600">Date: {formatDateIST()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">
                Informations du magasin
              </h2>
              <p className="text-sm text-gray-600">{invoiceData.storeName}</p>
              <p className="text-sm text-gray-600">{invoiceData.storeAddress}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">
                Informations du client
              </h2>
              <p className="text-sm text-gray-600">{invoiceData.clientName}</p>
              <p className="text-sm text-gray-600">{invoiceData.clientPhone}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Articles</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                    Article
                  </th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                    Prix Unitaire
                  </th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                    Quantité
                  </th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                    Sous total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.products.map((product, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 text-sm text-gray-600">
                      {product.name}
                    </td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-600">
                      $
                      {product.unitPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-600">
                      {product.quantity}
                    </td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-600">
                      $
                      {(product.unitPrice * product.quantity).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <p className="text-lg font-semibold text-gray-700">
              Total: $
              {invoiceData.products
                .reduce((sum, product) => sum + product.unitPrice * product.quantity, 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}