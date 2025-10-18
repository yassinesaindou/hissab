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
import { useState } from 'react';
import { signupAction } from '@/app/actions';

const formSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Le nom doit avoir au moins 2 caractères.' })
      .max(50, { message: 'Le nom doit comporter au maximum 50 caractères. ' }),
    email: z
      .string()
      .min(7, { message: 'L\'email doit avoir au moins 7 caractères.' })
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
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export default function SignupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    setMessage(null);
    const result = await signupAction(values);
    setMessage(result.message);
    setIsPending(false);
    if (result.success) {
      form.reset();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-2">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">S&apos;inscrire</h1>
        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.includes('successful')
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de telephone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1234567890"
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comfirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confimez votre mot de passe"
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
              disabled={isPending}
            >
              {isPending ? 'Enregisterement...' : 'S\'inscrire'}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-gray-600">
          J&apos;ai deja un compte?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}