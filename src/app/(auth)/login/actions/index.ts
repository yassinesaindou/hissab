"use server";

 
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const loginFormSchema = z.object({
  email: z.string().email().min(7),
  password: z.string().min(8),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export async function loginAction(formData: LoginFormData) {
  console.log("🔐 Server action called with:", formData);

  try {
    // Validate form data
    const validatedData = loginFormSchema.parse(formData);
    console.log("✅ Form data validated");

    // Initialize Supabase server client
    const supabase = createSupabaseServerClient();
    console.log("🔧 Supabase client created");

    // Sign in user with Supabase Auth
    console.log("👤 Attempting sign in...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    console.log("📊 Supabase response:", { data, error });

    if (error || !data.session) {
      console.error("❌ Supabase auth error:", error);
      return {
        success: false,
        message: error?.message?.includes("Invalid login credentials")
          ? "Mot de passe ou email incorrect"
          : error?.message || "Echec durant la connexion",
      };
    }

  
    console.log("🎉 Login successful, session created");
    return { success: true, message: "Connexion réussie. Patientez..." };
  } catch (error: unknown) {
    console.error("❌ Unexpected error during login:", error);

    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }

    // Type-safe error message extraction
    let errorMessage = "Une erreur s'est produite";

    if (error instanceof Error) {
      errorMessage = `Erreur serveur: ${error.message}`;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}
