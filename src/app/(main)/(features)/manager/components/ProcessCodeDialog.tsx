/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/manager/components/ProcessCodeDialog.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  CheckCircle,
  Clock,
  Key,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { processSubscriptionCode } from "../actions/actions";

const processCodeSchema = z.object({
  planId: z.coerce
    .number({ invalid_type_error: "Plan requis" })
    .int({ message: "Plan invalide" })
    .min(1, { message: "Plan invalide" })
    .max(3, { message: "Plan invalide" }),
  months: z.coerce
    .number({ invalid_type_error: "Nombre requis" })
    .int({ message: "Doit être un nombre entier" })
    .min(1, { message: "Minimum 1 mois" })
    .max(36, { message: "Maximum 36 mois" }),
});

type ProcessCodeForm = z.infer<typeof processCodeSchema>;

interface ProcessCodeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  code: {
    codeId: string;
    code: string;
    storeId: string;
    createdAt: string;
    isSettled: boolean;
    store?: {
      storeId: string;
      storeName: string;
      storePhoneNumber?: string;
    };
    profile?: {
      userId: string;
      name: string;
      email: string;
      phoneNumber?: string;
    };
  } | null;
  plans: any[];
  onSuccess: () => void;
}

export default function ProcessCodeDialog({
  isOpen,
  onOpenChange,
  code,
  plans,
  onSuccess,
}: ProcessCodeDialogProps) {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const form = useForm<ProcessCodeForm>({
    resolver: zodResolver(processCodeSchema),
    defaultValues: {
      planId: 2,
      months: 1,
    },
  });

  const onSubmit = async (data: ProcessCodeForm) => {
    if (!code) return;

    setProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("codeId", code.codeId);
      formData.append("planId", data.planId.toString());
      formData.append("months", data.months.toString());

      const response = await processSubscriptionCode(formData);

      setResult(response);

      if (response.success) {
        setTimeout(() => {
          onSuccess();
          form.reset();
          setResult(null);
        }, 1500);
      }
    } catch (error) {
      console.error("Error processing code:", error);
      setResult({
        success: false,
        error: "Une erreur s'est produite",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!code) return null;

  const selectedPlan = form.watch("planId")
    ? plans.find((p) => p.planId === form.watch("planId"))
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Traiter un code de paiement
          </DialogTitle>
          <DialogDescription>
            Validez le paiement et activez l'abonnement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                <code className="font-mono font-bold text-lg">{code.code}</code>
              </div>
              <Badge
                className={
                  code.isSettled
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }>
                {code.isSettled ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Déjà traité
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    En attente
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-blue-700">
              Soumis le{" "}
              {format(new Date(code.createdAt), "dd MMMM yyyy à HH:mm", {
                locale: fr,
              })}
            </p>
          </div>

          {/* Store Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">
              Informations du magasin
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>Magasin</span>
                </div>
                <p className="font-medium">{code.store?.storeName}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="font-medium">{code.profile?.email || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>Téléphone</span>
                </div>
                <p className="font-medium">
                  {code.profile?.phoneNumber ||
                    code.store?.storePhoneNumber ||
                    "N/A"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Processing Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plan Selection */}
                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Plan à activer
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem
                              key={plan.planId}
                              value={plan.planId.toString()}>
                              <div className="flex items-center justify-between">
                                <span>{plan.name}</span>
                                <span className="text-sm font-medium">
                                  {plan.price.toLocaleString()} KMF
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Months */}
                <FormField
                  control={form.control}
                  name="months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Durée (mois)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="36"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Plan Details */}
              {selectedPlan && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Détails du plan
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Utilisateurs</p>
                      <p className="font-medium">
                        {selectedPlan.numberOfUsers}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transactions/jour</p>
                      <p className="font-medium">
                        {selectedPlan.transactionsPerDay}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prix mensuel</p>
                      <p className="font-medium text-blue-600">
                        {selectedPlan.price.toLocaleString()} KMF
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prix total</p>
                      <p className="font-medium text-green-600">
                        {(
                          selectedPlan.price * form.watch("months")
                        ).toLocaleString()}{" "}
                        KMF
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Result Message */}
              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <p className="font-medium">
                      {result.message || result.error}
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    form.reset();
                    setResult(null);
                  }}
                  disabled={processing}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={processing || code.isSettled}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider et activer
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
