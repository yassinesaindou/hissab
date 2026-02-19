"use client"
import {
  BatteryCharging,
  GitPullRequest,
  Layers,
  RadioTower,
  SquareKanban,
  WandSparkles,
  Sparkles,

  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface Reason {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient?: string;
  stats?: string;
}

interface Feature43Props {
  heading?: string;
  reasons?: Reason[];
}

const Features = ({
  heading = "Pourquoi choisir Hissab ?",
  reasons = [
    {
      title: "Gestion des ventes",
      description:
        "Suivez toutes vos ventes en temps réel, simplifiez les transactions et améliorez la satisfaction de vos clients.",
      icon: <GitPullRequest className="size-6" />,
      gradient: "from-blue-500 to-cyan-500",
      stats: "+45% d'efficacité"
    },
    {
      title: "Suivi des stocks",
      description:
        "Gardez un œil sur vos stocks, recevez des alertes de rupture et optimisez vos approvisionnements.",
      icon: <SquareKanban className="size-6" />,
      gradient: "from-emerald-500 to-teal-500",
      stats: "Alertes en temps réel"
    },
    {
      title: "Rapports détaillés",
      description:
        "Générez facilement des rapports sur vos ventes, vos produits et vos performances commerciales.",
      icon: <RadioTower className="size-6" />,
      gradient: "from-purple-500 to-pink-500",
      stats: "Analyses avancées"
    },
    {
      title: "Gestion des factures",
      description:
        "Créez et suivez vos factures facilement, pour garder le contrôle sur vos encaissements et relances.",
      icon: <WandSparkles className="size-6" />,
      gradient: "from-orange-500 to-red-500",
      stats: "Factures automatiques"
    },
    {
      title: "Multi-utilisateurs",
      description:
        "Attribuez des rôles à vos employés et contrôlez leurs accès selon leurs responsabilités.",
      icon: <Layers className="size-6" />,
      gradient: "from-violet-500 to-purple-500",
      stats: "Jusqu'à 50 utilisateurs"
    },
    {
      title: "Performance et fiabilité",
      description:
        "Hissab est rapide, fiable et disponible 24/7 pour votre boutique, même hors-ligne.",
      icon: <BatteryCharging className="size-6" />,
      gradient: "from-pink-500 to-rose-500",
      stats: "99.9% disponibilité"
    },
  ],
}: Feature43Props) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <section id="features" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          opacity: 0.4
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with animated badge */}
        <div className="text-center mb-16 md:mb-24 relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-4 py-2 mb-6 mx-auto">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Fonctionnalités puissantes
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {heading}
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Découvrez pourquoi plus de <span className="font-semibold text-blue-600">20+ commerçants</span> font confiance à Hissab pour gérer leur boutique au quotidien.
          </p>

          {/* Floating stats */}
          <div className="absolute -top-4 -right-4 hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">4.9/5 satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, i) => {
            const isHovered = hoveredCard === i
            return (
              <div
                key={i}
                className="group relative"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Gradient border animation */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${reason.gradient} rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500 ${isHovered ? 'opacity-75' : ''}`}></div>
                
                {/* Main card */}
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-800 overflow-hidden">
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Icon with gradient background */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-r ${reason.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                    <div className={`relative w-16 h-16 bg-gradient-to-r ${reason.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      {reason.icon}
                    </div>
                    
                    {/* Floating stat badge */}
                    {reason.stats && (
                      <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1 text-xs font-semibold shadow-lg border border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform">
                        <span className={`bg-gradient-to-r ${reason.gradient} bg-clip-text text-transparent`}>
                          {reason.stats}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {reason.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {reason.description}
                  </p>

                  {/* Feature highlights */}
                  <div className="space-y-2 mb-4">
                    {[
                      "Interface intuitive",
                      "Mise à jour en temps réel",
                      "Support prioritaire"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${reason.gradient}`}></div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Learn more link */}
                  <Link 
                    href="#" 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group/link"
                  >
                    En savoir plus
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>

                  {/* Decorative elements */}
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent dark:from-gray-800 rounded-tl-3xl opacity-50"></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-1">
            <Link 
              href="/signup" 
              className="px-8 py-4 bg-white/20 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
            >
              Commencer maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="px-4 text-sm">14 jours gratuits</span>
          </div>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl animate-float hidden lg:block"></div>
      <div className="absolute bottom-40 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-float animation-delay-2000 hidden lg:block"></div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </section>
  );
};

export { Features };