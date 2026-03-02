// app/deactivated/page.tsx
"use client";
 
import { AlertCircle } from "lucide-react";

export default function DeactivatedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Compte Désactivé
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Votre compte employé a été désactivé. Veuillez contacter votre administrateur pour le réactiver.
        </p>

        

        

        
      </div>
    </div>
  );
}