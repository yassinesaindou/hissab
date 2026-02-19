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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { performFullSync } from "@/lib/offline/fullSync";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  Store, 
  Shield, 
  Zap,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Image from "next/image";

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
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const result = await Promise.race([loginAction(values), timeoutPromise]);

      console.log("✅ Login action result:", result);

      setMessage(result.message);

      if (result.success) {
        setMessage("Connexion réussie ! Synchronisation en cours...");

        const syncResult = await performFullSync();

        if (syncResult.success) {
          console.log("Full sync done, going to dashboard");
          router.push("/dashboard");
        } else {
          console.log("Full sync failed, still going to dashboard");
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          opacity: 0.4
        }} />
      </div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl animate-float hidden lg:block"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-float animation-delay-2000 hidden lg:block"></div>

      <div className="w-full max-w-md relative">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4 group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-xl">
              <Image
                src="/Hissab_logo.png"
                alt="Hissab Logo"
                width={140}
                height={45}
                className="relative"
              />
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Connectez-vous à votre espace
            </span>
          </div>
        </div>

        {/* Main card with glass effect */}
        <div className="relative group">
          {/* Animated gradient border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-gradient-xy"></div>
          
          <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
            
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                  Content de vous revoir
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Connectez-vous pour gérer votre boutique
                </p>
              </div>

              {/* Message alert */}
              {message && (
                <div
                  className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                    message.includes("réussie") || message.includes("success")
                      ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                  }`}
                >
                  {message.includes("réussie") || message.includes("success") ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                          Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative group/input">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" />
                            <Input
                              placeholder="joeharry@gmail.com"
                              className="pl-10 py-6 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 rounded-xl"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Password field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                          Mot de passe
                        </FormLabel>
                        <FormControl>
                          <div className="relative group/input">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Entrez votre mot de passe"
                              className="pl-10 pr-12 py-6 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 rounded-xl"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Forgot password link */}
                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group/btn"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connexion en cours...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Se connecter
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Sign up link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Je n&apos;ai pas de compte{" "}
                  <Link
                    href="/signup"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline inline-flex items-center gap-1 group"
                  >
                    S&apos;inscrire
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {[
            { icon: Store, text: "Gestion magasin", color: "blue" },
            { icon: Shield, text: "Sécurisé", color: "emerald" },
            { icon: Zap, text: "Mode hors-ligne", color: "purple" }
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
              <feature.icon className={`w-3.5 h-3.5 text-${feature.color}-500`} />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Trust badge */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/terms" className="hover:underline text-blue-600 dark:text-blue-400">
              conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/privacy" className="hover:underline text-blue-600 dark:text-blue-400">
              politique de confidentialité
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 5s ease infinite;
        }
      `}</style>
    </div>
  );
}