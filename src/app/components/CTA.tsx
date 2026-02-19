'use client'
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  Zap, 
  Shield, 
  Star,
  Rocket,
  Clock,
  Smartphone,
   
  ChevronRight
} from "lucide-react";

const CtaSection = () => {
  const [mounted, setMounted] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-orange-400/30 to-pink-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          opacity: 0.4
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main card with glass effect */}
        <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
          
          {/* Animated gradient border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur opacity-30 animate-gradient-xy"></div>
          
          {/* Inner content */}
          <div className="relative p-8 md:p-12 lg:p-16">
            {/* Floating badges */}
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                <Zap className="w-3 h-3" />
                +45% de croissance
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                4.9/5
              </div>
            </div>

            {/* Header with sparkles */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Offre limitée - 14 jours gratuits
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Prêt à 
                </span>
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent ml-2">
                  transformer
                </span>
                <br />
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  votre commerce ?
                </span>
              </h2>

              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Rejoignez plus de <span className="font-bold text-blue-600">20+ commerçants</span> qui ont déjà simplifié leur gestion avec Hissab. 
                Commencez sans risque, annulez à tout moment.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
              {[
                { icon: Rocket, text: "Installation rapide", color: "blue" },
                { icon: Clock, text: "Support 24/7", color: "emerald" },
                { icon: Shield, text: "Sécurisé", color: "purple" },
                { icon: Smartphone, text: "Application PWA", color: "amber" }
              ].map((item, index) => (
                <div key={index} className="group text-center">
                  <div className={`inline-flex p-2 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30 mb-2 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300`}>
                    <item.icon className={`w-4 h-4 text-${item.color}-600 dark:text-${item.color}-400`} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                prefetch={false}
                href="/signin"
                className="group relative px-8 py-4 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-lg shadow-2xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-500 hover:-translate-y-1 hover:scale-105 min-w-[200px]"
                onMouseEnter={() => setHoveredButton('primary')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <span className="relative flex items-center justify-center gap-3">
                  Commencer gratuitement
                  <ArrowRight className={`w-5 h-5 transition-all duration-300 ${
                    hoveredButton === 'primary' ? 'translate-x-2' : ''
                  }`} />
                </span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></span>
              </Link>

              <Link
                prefetch={false}
                href="/demo"
                className="group relative px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-lg hover:border-blue-600 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:-translate-y-1 overflow-hidden min-w-[200px]"
                onMouseEnter={() => setHoveredButton('secondary')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <span className="relative flex items-center justify-center gap-2">
                  Voir la démo
                  <ChevronRight className={`w-5 h-5 transition-all duration-300 ${
                    hoveredButton === 'secondary' ? 'translate-x-1' : ''
                  }`} />
                </span>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              {[
                { icon: CheckCircle, text: "14 jours d'essai", color: "emerald" },
                { icon: Shield, text: "Sans carte bancaire", color: "blue" },
                { icon: Clock, text: "Annulation libre", color: "purple" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 group">
                  <div className={`p-1 rounded-full bg-${badge.color}-100 dark:bg-${badge.color}-900/30 group-hover:scale-110 transition-transform`}>
                    <badge.icon className={`w-4 h-4 text-${badge.color}-600 dark:text-${badge.color}-400`} />
                  </div>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-gray-900 dark:text-white">20+</span> commerçants nous ont rejoints cette semaine
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decorative elements */}
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-float animation-delay-2000"></div>
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
    </section>
  );
};

export default CtaSection;