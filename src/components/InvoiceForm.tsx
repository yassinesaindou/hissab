"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createInvoice } from "@/app/actions";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const productSchema = z.object({
  productId: z.string().optional(),
  isManual: z.boolean(),
  name: z.string().min(1, "Product name is required"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const formSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientPhone: z.string().min(1, "Client phone is required"),
  storeName: z.string().min(1, "Store name is required"),
  storeAddress: z.string().min(1, "Store address is required"),
  products: z.array(productSchema).min(1, "At least one product is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface Product {
  productId: string;
  name: string;
  unitPrice: number;
}

interface InvoiceFormProps {
  storeName?: string,
  storeAddress?: string,
  storePhoneNumber?: string
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
  sections:{
    display:'flex',
    justifyContent:'space-between',
    flexDirection:'row',
  }
});

// PDF Document Component
const PDFDocument = ({ data , storePhoneNumber }: { data: FormValues ,  storePhoneNumber?: string }) => {
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
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.date}>Date: {formatDateIST()}</Text>
          </View>
          <View style={styles.sections}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Store Details</Text>
              <Text style={styles.text}>{data.storeName}</Text>
              <Text style={styles.text}>{data.storeAddress}</Text>
              {storePhoneNumber && <Text style={styles.text}>{storePhoneNumber}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client Details</Text>
              <Text style={styles.text}>{data.clientName}</Text>
              <Text style={styles.text}>{data.clientPhone}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Products</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Product</Text>
                <Text style={styles.tableCell}>Unit Price</Text>
                <Text style={styles.tableCell}>Quantity</Text>
                <Text style={[styles.tableCell, styles.tableCellLast]}>
                  Subtotal
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

export default function InvoiceForm({ products , storeAddress, storeName, storePhoneNumber }: InvoiceFormProps ) {
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<FormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  console.log(storeName, storeAddress)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      storeName:storeName || '',
      storeAddress : storeAddress|| '',
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
        `Product ${
          product.name
        }: unitPrice=${unitPrice}, quantity=${quantity}, subtotal=${
          unitPrice * quantity
        }`
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
                Store & Client Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
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
                      <FormLabel>Client Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 123 456 7890" {...field} />
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
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Store" defaultValue={storeName} {...field} />
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
                      <FormLabel>Store Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City" defaultValue={storeAddress} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">Products</h2>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col space-y-4 border-b pb-4">
                  <div className="flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name={`products.${index}.isManual`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const isManual = value === "manual";
                              form.setValue(
                                `products.${index}.isManual`,
                                isManual
                              );
                              form.setValue(`products.${index}.productId`, "");
                              form.setValue(`products.${index}.name`, "");
                              form.setValue(`products.${index}.unitPrice`, 0);
                              console.log(
                                `Entry type changed for index ${index}:`,
                                isManual
                              );
                            }}
                            value={field.value ? "manual" : "select"}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="select">
                                Select Product
                              </SelectItem>
                              <SelectItem value="manual">
                                Manual Entry
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    {form.watch(`products.${index}.isManual`) ? (
                      <>
                        <FormField
                          control={form.control}
                          name={`products.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter product name"
                                  {...field}
                                />
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
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  value={field.value}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
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
                            <FormItem className="flex-1">
                              <FormLabel>Product</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  console.log(
                                    `Product select onValueChange for index ${index}:`,
                                    value
                                  );
                                  field.onChange(value);
                                  const product = products.find(
                                    (p) => p.productId === value
                                  );
                                  if (product) {
                                    form.setValue(
                                      `products.${index}.name`,
                                      product.name
                                    );
                                    form.setValue(
                                      `products.${index}.unitPrice`,
                                      product.unitPrice
                                    );
                                    console.log(
                                      `Selected product for index ${index}:`,
                                      product
                                    );
                                  } else {
                                    form.setValue(`products.${index}.name`, "");
                                    form.setValue(
                                      `products.${index}.unitPrice`,
                                      0
                                    );
                                  }
                                }}
                                value={field.value || ""}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem
                                      key={product.productId}
                                      value={product.productId}>
                                      {product.name} (${product.unitPrice})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`products.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem className="w-32">
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={field.value}
                                  readOnly
                                  className="bg-gray-100"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    <FormField
                      control={form.control}
                      name={`products.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-gray-100"
                onClick={() =>
                  append({
                    isManual: false,
                    name: "",
                    unitPrice: 0,
                    quantity: 1,
                    productId: "",
                  })
                }>
                Add Product
              </Button>
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center">
              <Button type="button" onClick={calculateTotal}>
                Calculate Total
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
                disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Invoice"}
              </Button>
              {submitMessage.includes("success") && invoiceData && (
                <>
                  <PDFDownloadLink
                    document={<PDFDocument storePhoneNumber={storePhoneNumber} data={invoiceData}   />}
                    fileName={`invoice ${invoiceData.clientName}.pdf`}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-gray-100 rounded-md text-sm font-medium">
                    {({ loading }) =>
                      loading ? "Generating PDF..." : "Download PDF"
                    }
                  </PDFDownloadLink>
                </>
              )}
            </div>
            {submitMessage && (
              <p
                className={`text-sm ${
                  submitMessage.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
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
                Store Details
              </h2>
              <p className="text-sm text-gray-600">{invoiceData.storeName}</p>
              <p className="text-sm text-gray-600">
                {invoiceData.storeAddress}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">
                Client Details
              </h2>
              <p className="text-sm text-gray-600">{invoiceData.clientName}</p>
              <p className="text-sm text-gray-600">{invoiceData.clientPhone}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Products</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                    Product
                  </th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                    Unit Price
                  </th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                    Quantity
                  </th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                    Subtotal
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
                      {(product.unitPrice * product.quantity).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 }
                      )}
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
                .reduce(
                  (sum, product) => sum + product.unitPrice * product.quantity,
                  0
                )
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
