// components/SettingsForm.tsx
"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserProfile, updateStoreDetails } from "@/app/actions";
import { User, Store as StoreIcon, CheckCircle } from "lucide-react";

const userProfileSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  phoneNumber: z.string().min(1, "Téléphone requis").regex(/^\+?\d{10,15}$/, "Numéro invalide"),
});

const storeDetailsSchema = z.object({
  storeName: z.string().min(1, "Nom de la boutique requis"),
  storeAddress: z.string().min(1, "Adresse requise"),
  storePhoneNumber: z.string().min(1, "Téléphone boutique requis").regex(/^\+?\d{10,15}$/, "Numéro invalide"),
});

type UserProfileValues = z.infer<typeof userProfileSchema>;
type StoreDetailsValues = z.infer<typeof storeDetailsSchema>;

type Props = {
  profile: { name: string; phoneNumber: string; storeId: string | null };
  store: { storeName: string; storeAddress: string; storePhoneNumber: string };
};

export default function SettingsForm({ profile, store }: Props) {
  const [userMessage, setUserMessage] = useState<string>("");
  const [storeMessage, setStoreMessage] = useState<string>("");

  const userForm = useForm<UserProfileValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: { name: profile.name || "", phoneNumber: profile.phoneNumber || "" },
  });

  const storeForm = useForm<StoreDetailsValues>({
    resolver: zodResolver(storeDetailsSchema),
    defaultValues: {
      storeName: store.storeName || "",
      storeAddress: store.storeAddress || "",
      storePhoneNumber: store.storePhoneNumber || "",
    },
  });

  const onUserSubmit = async (data: UserProfileValues) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("phoneNumber", data.phoneNumber);

    const result = await updateUserProfile(formData);
    setUserMessage(result.success ? "Profil mis à jour !" : result.message);
  };

  const onStoreSubmit = async (data: StoreDetailsValues) => {
    const formData = new FormData();
    formData.append("storeName", data.storeName);
    formData.append("storeAddress", data.storeAddress);
    formData.append("storePhoneNumber", data.storePhoneNumber);

    const result = await updateStoreDetails(formData);
    setStoreMessage(result.success ? "Boutique mise à jour !" : result.message);
  };

  return (
    <Tabs defaultValue="user" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm h-14 rounded-xl p-1">
        <TabsTrigger
          value="user"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center gap-2"
        >
          <User className="h-5 w-5" />
          Profil Utilisateur
        </TabsTrigger>
        <TabsTrigger
          value="store"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg flex items-center gap-2"
        >
          <StoreIcon className="h-5 w-5" />
          Boutique
        </TabsTrigger>
      </TabsList>

      {/* User Tab */}
      <TabsContent value="user" className="mt-8">
        <FormProvider {...userForm}>
          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
            <FormField
              control={userForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Nom complet</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Jean Dupont"
                      className="bg-white/70 border-white/30 focus:border-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={userForm.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Téléphone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+261 34 123 4567"
                      className="bg-white/70 border-white/30 focus:border-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg"
                disabled={userForm.formState.isSubmitting}
              >
                {userForm.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
            {userMessage && (
              <div
                className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                  userMessage.includes("mis à jour")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {userMessage}
              </div>
            )}
          </form>
        </FormProvider>
      </TabsContent>

      {/* Store Tab */}
      <TabsContent value="store" className="mt-8">
        <FormProvider {...storeForm}>
          <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-6">
            <FormField
              control={storeForm.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Nom de la boutique</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Boutique Centrale"
                      className="bg-white/70 border-white/30 focus:border-purple-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={storeForm.control}
              name="storeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Adresse</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Rue Principale, Antananarivo"
                      className="bg-white/70 border-white/30 focus:border-purple-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={storeForm.control}
              name="storePhoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Téléphone boutique</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+261 32 123 4567"
                      className="bg-white/70 border-white/30 focus:border-purple-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium shadow-lg"
                disabled={storeForm.formState.isSubmitting}
              >
                {storeForm.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
            {storeMessage && (
              <div
                className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                  storeMessage.includes("mis à jour")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {storeMessage}
              </div>
            )}
          </form>
        </FormProvider>
      </TabsContent>
    </Tabs>
  );
}