/* eslint-disable react/no-unescaped-entities */
// app/signup/page.tsx
'use client';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState, startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signupAction } from '@/app/actions';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { getUserProfile } from '@/lib/offline/session';
import { createSupabaseClient } from '@/lib/supabase/client';

const formSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Le nom doit avoir au moins 2 caractères.' })
      .max(50, { message: 'Le nom doit comporter au maximum 50 caractères.' }),
    email: z
      .string()
      .min(7, { message: "L'email doit avoir au moins 7 caractères." })
      .max(50)
      .email({ message: 'Veuillez entrer une adresse email valide.' }),
    phone: z
      .string()
      .min(10, { message: 'Le no de telephone doit avoir au moins 10 chiffres.' })
      .max(15, { message: 'Le no de telephone doit avoir au maximum 15 chiffres.' })
      .regex(/^\+?\d+$/, {
        message: 'Le no de telephone doit contenir uniquement des chiffres et un signe plus (+) au debut.',
      }),
    password: z
      .string()
      .min(8, { message: 'Le mot de passe doit avoir au moins 8 caractères.' })
      .max(50),
    confirmPassword: z
      .string()
      .min(8, { message: 'Le mot de passe doit avoir au moins 8 caractères.' })
      .max(50),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export default function SignupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
  const checkSession = async () => {
    try {
      // 1. Fast path: if online, check real Supabase session
      if (navigator.onLine) {
        const supabase = createSupabaseClient(); // create fresh instance
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
          return;
        }
      }

      // 2. Offline fallback: check if we have a cached profile
      const localProfile = await getUserProfile();

      if (localProfile && localProfile.userId) {
        // We have local data → user was logged in → go to dashboard
        router.replace('/dashboard');
      }

      // Else: no session & no local data → stay on login (first visit or logged out)
    } catch (err) {
      console.warn('Session check failed (likely offline):', err);

      // Last chance fallback: even if Supabase failed, check local
      const localProfile = await getUserProfile();
      if (localProfile && localProfile.userId) {
        router.replace('/dashboard');
      }
    }
  };

  checkSession();
}, [router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await signupAction(values);
        
        setMessage(result.message);
        
        if (result.success) {
          form.reset();
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
        setMessage("Une erreur s'est produite");
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-4 py-2 mb-4">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Créez votre compte gratuitement
          </span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
          Rejoignez Hissab
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          14 jours d'essai gratuit - Sans carte bancaire
        </p>
      </div>

      {/* Message alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.includes('réussie') || message.includes('successful') || message.includes('Inscription réussie')
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}
        >
          {message.includes('réussie') || message.includes('successful') || message.includes('Inscription réussie') ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{message}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Name field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                  Nom complet
                </FormLabel>
                <FormControl>
                  <div className="relative group/input">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" />
                    <Input
                      placeholder="John Doe"
                      className="pl-10 py-6 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 rounded-xl"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-500 text-xs mt-1" />
              </FormItem>
            )}
          />

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

          {/* Phone field */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                  Numéro de téléphone
                </FormLabel>
                <FormControl>
                  <div className="relative group/input">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" />
                    <Input
                      placeholder="+269 123 45 67"
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
                      placeholder="8 caractères minimum"
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

          {/* Confirm Password field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                  Confirmer le mot de passe
                </FormLabel>
                <FormControl>
                  <div className="relative group/input">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmez votre mot de passe"
                      className="pl-10 pr-12 py-6 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 rounded-xl"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? (
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

          {/* Password strength indicator (visual only) */}
          <div className="space-y-1">
            <div className="flex gap-1 h-1">
              {[1,2,3,4].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-full rounded-full transition-colors ${
                    form.watch('password').length >= 8
                      ? i <= Math.min(4, Math.floor(form.watch('password').length / 2))
                        ? 'bg-emerald-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {form.watch('password').length < 8 
                ? '8 caractères minimum' 
                : 'Mot de passe sécurisé ✓'}
            </p>
          </div>

          {/* Terms and conditions */}
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-500">
            <input type="checkbox" id="terms" className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="terms">
              J&apos;accepte les{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">
                conditions d&apos;utilisation
              </Link>{' '}
              et la{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                politique de confidentialité
              </Link>
            </label>
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
                Enregistrement...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                S'inscrire gratuitement
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>
      </Form>

      {/* Login link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          J'ai déjà un compte ?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            Se connecter
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </p>
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {[
          { text: "14 jours gratuits", color: "blue" },
          { text: "Sans carte", color: "emerald" },
          { text: "Annulation libre", color: "purple" }
        ].map((badge, idx) => (
          <div
            key={idx}
            className={`text-xs bg-${badge.color}-100 dark:bg-${badge.color}-900/30 text-${badge.color}-700 dark:text-${badge.color}-400 px-3 py-1 rounded-full border border-${badge.color}-200 dark:border-${badge.color}-800`}
          >
            {badge.text}
          </div>
        ))}
      </div>
    </div>
  );
}