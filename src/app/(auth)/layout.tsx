 
 
import Image from "next/image";
import Link from "next/link";
import { 
  Store, 
  Shield, 
  Zap, 
  Star,
  Users,
  TrendingUp
} from "lucide-react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      
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
      <div className="absolute top-40 right-40 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl animate-float animation-delay-4000 hidden lg:block"></div>

      {/* Main container */}
      <div className="flex w-full">
        
        {/* Left side - Branding & Features (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
          <div className="max-w-lg">
            {/* Logo with glow */}
            <div className="relative inline-block mb-8 group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-2xl">
                <Image
                  src="/Hissab_logo.png"
                  alt="Hissab Logo"
                  width={180}
                  height={55}
                  className="relative"
                />
              </div>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Gérez votre commerce
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                en toute simplicité
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Rejoignez plus de <span className="font-bold text-blue-600">20+ commerçants</span> qui utilisent Hissab au quotidien pour gérer leurs ventes, stocks et factures.
            </p>

            {/* Feature list */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Store, text: "Gestion complète des ventes", color: "blue" },
                { icon: TrendingUp, text: "Suivi des stocks en temps réel", color: "emerald" },
                { icon: Users, text: "Multi-utilisateurs avec rôles", color: "purple" },
                { icon: Zap, text: "Mode hors-ligne & PWA", color: "amber" },
                { icon: Shield, text: "Sécurisé et fiable", color: "red" },
                { icon: Star, text: "Support prioritaire 24/7", color: "yellow" }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className={`p-2 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900/30 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-5 h-5 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {[1,2,3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2">4.9/5</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 italic">
                &ldquo;Hissab a complètement transformé ma façon de gérer mon magasin. Simple, rapide et efficace !&rdquo;
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">— Ali Madi, Propriétaire</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms (login/signup) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo (visible only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-30"></div>
                <Image
                  src="/Hissab_logo.png"
                  alt="Hissab Logo"
                  width={140}
                  height={45}
                  className="relative"
                />
              </div>
            </div>

            {/* Auth card with glass effect */}
            <div className="relative group">
              {/* Animated gradient border */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-gradient-xy"></div>
              
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
                
                <div className="p-8">
                  {children}
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                En continuant, vous acceptez nos{" "}
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