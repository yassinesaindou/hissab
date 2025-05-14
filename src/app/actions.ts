'use server';
import { createSupabaseServerClient, createSubscription } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const SignupFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters.' })
      .max(50, { message: 'Name must be at most 50 characters.' }),
    email: z
      .string()
      .min(7, { message: 'Email must be at least 7 characters.' })
      .max(50)
      .email({ message: 'Please enter a valid email.' }),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 digits.' })
      .max(15, { message: 'Phone number must be at most 15 digits.' })
      .regex(/^\+?\d+$/, {
        message: 'Phone number must contain only digits and an optional leading +.',
      }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .max(50),
    confirmPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .max(50),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
const loginFormSchema = z.object({
  email: z
    .string()
    .min(7, { message: 'Email must be at least 7 characters.' })
    .max(50)
    .email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .max(50),
});
 
type LoginFormData = z.infer<typeof loginFormSchema>;
type SignupFormData = z.infer<typeof SignupFormSchema>;

export async function signupAction(formData: SignupFormData) {
  try {
    // Validate form data
    const validatedData = SignupFormSchema.parse(formData);

    // Initialize Supabase server client
    const supabase = createSupabaseServerClient();

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          phoneNumber: validatedData.phone,
        },
      },
    });

    if (authError || !authData.user) {
      return {
        success: false,
        message: authError?.message.includes('already registered')
          ? 'Email already in use'
          : authError?.message || 'Signup failed',
      };
    }

    // Create profile (skip if using Supabase trigger)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        userId: authData.user.id,
        name: validatedData.name,
        phoneNumber: validatedData.phone,
        email: validatedData.email,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
      return { success: false, message: 'Failed to create profile' };
    }

    // Create subscription
    const subscription = await createSubscription(authData.user.id, 'free');
    if (!subscription) {
      return { success: false, message: 'Failed to create subscription' };
    }

    // Update profile with subscriptionId
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscriptionId: subscription.id })
      .eq('userId', authData.user.id);

    if (updateError) {
      console.error('Error updating profile with subscription:', updateError.message);
      return { success: false, message: 'Failed to link subscription' };
    }

    return { success: true, message: 'Signup successful! Please check your email to confirm.' };
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: 'An unexpected error occurred' };
  }
}




export async function loginAction(formData: LoginFormData) {
  try {
    // Validate form data
    const validatedData = loginFormSchema.parse(formData);

    // Initialize Supabase server client
    const supabase = createSupabaseServerClient();

    // Sign in user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error || !data.session) {
      return {
        success: false,
        message: error?.message.includes('Invalid login credentials')
          ? 'Invalid email or password'
          : error?.message || 'Login failed',
      };
    }

    // Session is automatically set via cookies by @supabase/ssr
    return { success: true, message: 'Login successful' };
  } catch (error) {
    console.error('Unexpected error during login:', error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: 'An unexpected error occurred' };
  }
}



export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout error:', error.message);
    throw new Error('Failed to log out');
  }
  redirect('/login');
}


