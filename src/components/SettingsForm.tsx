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
import { updateUserProfile, updateStoreDetails } from "@/app/actions";

const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^\+?\d{10,15}$/, "Invalid phone number"),
});

const storeDetailsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  storeAddress: z.string().min(1, "Store address is required"),
  storePhoneNumber: z.string().min(1, "Store phone is required").regex(/^\+?\d{10,15}$/, "Invalid store phone number"),
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
    setUserMessage(result.message);
  };

  const onStoreSubmit = async (data: StoreDetailsValues) => {
    const formData = new FormData();
    formData.append("storeName", data.storeName);
    formData.append("storeAddress", data.storeAddress);
    formData.append("storePhoneNumber", data.storePhoneNumber);

    const result = await updateStoreDetails(formData);
    setStoreMessage(result.message);
  };

  return (
    <>
      {/* User Details Form */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">User Details</h2>
        <FormProvider {...userForm}>
          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
            <FormField
              control={userForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 123 456 7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-gray-100"
                disabled={userForm.formState.isSubmitting}
              >
                {userForm.formState.isSubmitting ? "Saving..." : "Save User Details"}
              </Button>
            </div>
            {userMessage && (
              <p
                className={`text-sm ${userMessage.includes("success") ? "text-green-600" : "text-red-600"}`}
              >
                {userMessage}
              </p>
            )}
          </form>
        </FormProvider>
      </div>

      {/* Store Details Form */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Store Details</h2>
        <FormProvider {...storeForm}>
          <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-4">
            <FormField
              control={storeForm.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Store" {...field} />
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
                  <FormLabel>Store Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City" {...field} />
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
                  <FormLabel>Store Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 123 456 7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-gray-100"
                disabled={storeForm.formState.isSubmitting}
              >
                {storeForm.formState.isSubmitting ? "Saving..." : "Save Store Details"}
              </Button>
            </div>
            {storeMessage && (
              <p
                className={`text-sm ${storeMessage.includes("success") ? "text-green-600" : "text-red-600"}`}
              >
                {storeMessage}
              </p>
            )}
          </form>
        </FormProvider>
      </div>
    </>
  );
}