// app/login/page.tsx
"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { performFullSync } from "@/lib/offline/fullSync";

// Import the server action

const formSchema = z.object({
  email: z
    .string()
    .min(7, { message: "L'email doit avoir au moins 7 caractères." })
    .max(50)
    .email({ message: "Veuillez entrer une adresse email valide." }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit avoir au moins 8 caractères." })
    .max(50),
});

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("🚀 Login form submitted:", values);
    setIsPending(true);
    setMessage(null);

    try {
      console.log("📤 Calling loginAction...");

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const result = await Promise.race([loginAction(values), timeoutPromise]);

      console.log("✅ Login action result:", result);

      setMessage(result.message);

      if (result.success) {
        setMessage("Connexion réussie ! Synchronisation en cours...");

        // This downloads products, profile, store → everything for offline
        const syncResult = await performFullSync();

        if (syncResult.success) {
          console.log("Full sync done, going to dashboard");
          router.push("/dashboard");
        } else {
          console.log("Full sync failed, still going to dashboard");
          // Still go to dashboard even if sync fails (offline mode will work)
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("❌ Login error details:", {
        error: err,
        name: (err as Error)?.name,
        message: (err as Error)?.message,
        stack: (err as Error)?.stack,
      });
      setMessage(
        `Erreur: ${
          (err as Error)?.message || "Une erreur réseau s'est produite"
        }`
      );
    } finally {
      console.log("🏁 Login process finished");
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-2 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Se Connecter
        </h1>
        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.includes("successful") || message.includes("réussie")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
            {message}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="joeharry@gmail.com"
                      className="border-gray-300 focus:ring-blue-600 focus:border-blue-600"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Entrez votre mot de passe"
                      className="border-gray-300 focus:ring-blue-600 focus:border-blue-600"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isPending}>
              {isPending ? "En cours..." : "Se connecter"}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Je n&apos;ai pas de compte{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
