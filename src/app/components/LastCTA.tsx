'use client'
import {
  ArrowRight,
  BarChart3,
  Clock,
  CreditCard,
  Package,
  Rocket,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Users,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const LastCTA = () => {
  const [mounted, setMounted] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const features = [
    { icon: Zap, text: "Ventes rapides", color: "blue" },
    { icon: Package, text: "Stock intelligent", color: "emerald" },
    { icon: BarChart3, text: "Rapports détaillés", color: "purple" },
    { icon: Users, text: "Multi-utilisateurs", color: "amber" }
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
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

      <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-12 lg:px-5">
        {/* Main card with glass effect */}
        <div className="relative group">
          {/* Animated gradient border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-gradient-xy"></div>
          
          <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            
            {/* Floating shapes - Redesigned */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Top right shapes */}
              <div className="absolute -top-20 -right-20 w-64 h-64">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-10 right-10 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-float animation-delay-1000"></div>
              </div>
              
              {/* Bottom left shapes */}
              <div className="absolute -bottom-20 -left-20 w-64 h-64">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
                <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-2xl animate-float animation-delay-3000"></div>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>

            {/* Content */}
            <div className="relative px-6 py-12 md:px-12 lg:px-16 lg:py-16">
              <div className="max-w-3xl mx-auto text-center">
                
                {/* Animated badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-4 py-2 mb-8 animate-pulse-slow">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Offre spéciale lancement
                  </span>
                </div>

                {/* Main heading with gradient */}
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Prêt à transformer
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    votre gestion ?
                  </span>
                </h2>

                {/* Description with animated counter */}
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  Rejoignez plus de <span className="font-bold text-blue-600 dark:text-blue-400 relative group/stat">
                    20+ commerçants
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/stat:opacity-100 transition whitespace-nowrap">
                      Et vous ?
                    </span>
                  </span> qui ont déjà simplifié leur gestion avec Hissab. 
                  <span className="block mt-2 text-blue-600 dark:text-blue-400 font-semibold">
                    Commencez gratuitement, annulez à tout moment.
                  </span>
                </p>

                {/* Rotating feature highlights */}
                <div className="flex justify-center gap-3 mb-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    const isActive = activeFeature === index;
                    return (
                      <div
                        key={index}
                        className={`relative transition-all duration-500 ${
                          isActive ? 'scale-110' : 'scale-100 opacity-50'
                        }`}
                      >
                        <div className={`p-3 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30`}>
                          <Icon className={`w-5 h-5 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                        </div>
                        {isActive && (
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {feature.text}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    prefetch={false}
                    href="/signup"
                    className="group relative px-8 py-4 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-lg shadow-2xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-500 hover:-translate-y-1 hover:scale-105 min-w-[240px]"
                    onMouseEnter={() => setHoveredButton(true)}
                    onMouseLeave={() => setHoveredButton(false)}
                  >
                    <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <span className="relative flex items-center justify-center gap-3">
                      Commencer gratuitement
                      <ArrowRight className={`w-5 h-5 transition-all duration-300 ${
                        hoveredButton ? 'translate-x-2' : ''
                      }`} />
                    </span>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></span>
                  </Link>

                  <Link
                    prefetch={false}
                    href="/demo"
                    className="group relative px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-lg hover:border-blue-600 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:-translate-y-1 overflow-hidden min-w-[200px]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <span className="relative flex items-center justify-center gap-2">
                      Voir la démo
                      <Rocket className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </span>
                  </Link>
                </div>

                {/* Trust badges row */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                  {[
                    { icon: Shield, text: "Sécurisé", color: "blue" },
                    { icon: Clock, text: "14 jours gratuits", color: "emerald" },
                    { icon: Smartphone, text: "Application mobile", color: "purple" },
                    { icon: CreditCard, text: "Sans carte", color: "amber" }
                  ].map((badge, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 group">
                      <div className={`p-1 rounded-full bg-${badge.color}-100 dark:bg-${badge.color}-900/30 group-hover:scale-110 transition-transform`}>
                        <badge.icon className={`w-4 h-4 text-${badge.color}-600 dark:text-${badge.color}-400`} />
                      </div>
                      <span>{badge.text}</span>
                    </div>
                  ))}
                </div>

                {/* Social proof with avatars */}
                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold shadow-lg hover:scale-110 hover:-translate-y-1 transition-transform"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-bold shadow-lg">
                      O
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-white">20+</span> commerçants
                  </div>
                </div>

                {/* Satisfaction guarantee */}
                <div className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.9/5 satisfaction client • 30+ avis vérifiés</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom floating elements */}
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl animate-float hidden lg:block"></div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-float animation-delay-2000 hidden lg:block"></div>
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
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 5s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .transition-transform {
          transition-property: transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 1500ms;
        }
      `}</style>
    </section>
  );
};

export default LastCTA;