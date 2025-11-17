// app/deactivated/page.tsx
"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle, Phone, Mail } from "lucide-react";

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

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-700">
            <Phone className="w-5 h-5 text-blue-600" />
            <span>+269 XXX XXXX</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-700">
            <Mail className="w-5 h-5 text-blue-600" />
            <span>admin@votremagasin.com</span>
          </div>
        </div>

        <Button
          onClick={() => window.location.href = "mailto:admin@votremagasin.com"}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Contacter l&apos;Admin
        </Button>

        <p className="text-xs text-gray-500 mt-6">
          Vous serez redirigé vers votre boîte mail.
        </p>
      </div>
    </div>
  );
}