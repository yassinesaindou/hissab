/* eslint-disable react/no-unescaped-entities */
'use client'
import {
  ArrowRight,
  Check,
  Clock,
  
  HelpCircle,
  Rocket,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      description: "Idéal pour les petites boutiques qui débutent avec Hissab.",
      price: {
        monthly: 4500,
        yearly: 45900 // 2 months free
      },
      icon: <Rocket className="w-6 h-6" />,
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
      features: [
        { name: "1 Utilisateur", included: true },
        { name: "Enregistrez vos produits", included: true },
        { name: "Rapports avancés", included: true },
        { name: "60 transactions par jour", included: true },
        { name: "Suivi des ventes quotidien", included: true },
        { name: "Gestion des stocks limitée", included: true },
        { name: "Exportation Excel", included: true },
        { name: "Support par email", included: true },
        { name: "Support prioritaire", included: false },
        { name: "Multi-utilisateurs", included: false },
      ],
      cta: "Commencer",
      popular: false
    },
    {
      id: "pro",
      name: "Pro",
      description: "Pour les boutiques en croissance qui ont besoin de plus de flexibilité.",
      price: {
        monthly: 9500,
        yearly: 96900 // ~20% discount
      },
      icon: <Zap className="w-6 h-6" />,
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
      features: [
        { name: "3 Utilisateurs", included: true },
        { name: "Enregistrez tous vos articles", included: true },
        { name: "Rapports avancés", included: true },
        { name: "250 transactions par jour", included: true },
        { name: "Suivi des ventes quotidien", included: true },
        { name: "Gestion des stocks complète", included: true },
        { name: "Exportation Excel", included: true },
        { name: "Factures illimitées", included: true },
        { name: "Support prioritaire", included: true },
        { name: "2 caissiers inclus", included: true },
      ],
      cta: "Commencer",
      popular: true,
      savings: "Économisez 19 000 Kmf/an"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Pour les grandes entreprises nécessitant toutes les fonctionnalités.",
      price: {
        monthly: 18500,
        yearly:188700 // ~16% discount
      },
      icon: <Shield className="w-6 h-6" />,
      color: "amber",
      gradient: "from-amber-500 to-orange-500",
      features: [
        { name: "Jusqu'à 10 Utilisateurs", included: true },
        { name: "Enregistrez tous vos articles", included: true },
        { name: "Rapports avancés", included: true },
        { name: "650 transactions par jour", included: true },
        { name: "Suivi des ventes quotidien", included: true },
        { name: "Gestion des stocks avancée", included: true },
        { name: "Exportation Excel", included: true },
        { name: "Factures illimitées", included: true },
        { name: "Formation pour vos équipes", included: true },
        { name: "Support dédié 24/7", included: true },
      ],
      cta: "Contacter les ventes",
      popular: false,
      custom: true
    }
  ];

  const yearlySavings = (monthly: number, yearly: number) => {
    const monthlyTotal = monthly * 12;
    const saved = monthlyTotal - yearly;
    return Math.round(saved);
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden" id="pricing">
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

      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-5">
        {/* Header with animated badge */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Tarifs simples et transparents
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Des forfaits pour
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent ml-2">
              chaque besoin
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Choisissez le forfait qui correspond à votre boutique et commencez à gérer vos ventes dès aujourd'hui.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                billingCycle === "yearly"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                -15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {plans.map((plan) => {
            const isHovered = hoveredCard === plan.id;
            const monthlyPrice = plan.price.monthly.toLocaleString();
            const yearlyPrice = plan.price.yearly.toLocaleString();
            const yearlySavingsAmount = yearlySavings(plan.price.monthly, plan.price.yearly);

            return (
              <div
                key={plan.id}
                className={`group relative transition-all duration-500 ${
                  plan.popular ? 'lg:-translate-y-4' : ''
                }`}
                onMouseEnter={() => setHoveredCard(plan.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-1">
                        <Star className="w-4 h-4 fill-white" />
                        Le plus populaire
                      </div>
                    </div>
                  </div>
                )}

                {/* Gradient border animation */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.gradient} rounded-3xl blur opacity-0 group-hover:opacity-75 transition duration-500 ${isHovered ? 'opacity-75' : ''}`}></div>
                
                {/* Main card */}
                <div className={`relative h-full bg-white dark:bg-gray-900 rounded-3xl p-8 border-2 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-purple-500 dark:border-purple-500 shadow-2xl' 
                    : 'border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500'
                }`}>
                  
                  {/* Header with icon */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${plan.gradient} text-white mb-4`}>
                        {plan.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{plan.description}</p>
                    </div>
                    
                    {/* Custom badge for Enterprise */}
                    {plan.custom && (
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Sur mesure
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {billingCycle === "monthly" ? monthlyPrice : yearlyPrice}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">Kmf</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {billingCycle === "monthly" ? "par mois" : "par an"}
                    </p>
                    
                    {/* Savings badge for yearly */}
                    {billingCycle === "yearly" && yearlySavingsAmount > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        Économisez {yearlySavingsAmount.toLocaleString()} Kmf
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-0.5 ${
                          feature.included 
                            ? 'text-emerald-500' 
                            : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          <Check className={`w-5 h-5 ${
                            feature.included ? '' : 'opacity-50'
                          }`} />
                        </div>
                        <span className={`text-sm ${
                          feature.included 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-400 dark:text-gray-600 line-through'
                        }`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link
                    prefetch={false}
                    href={plan.custom ? "/contact" : "/signup"}
                    className={`group relative w-full py-4 rounded-2xl font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-1'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* Money-back guarantee for non-enterprise */}
                 
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom features */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
             
            { icon: Clock, text: "Annulation libre", subtext: "Sans frais" },
            { icon: Users, text: "Support prioritaire", subtext: "24/7 pour Pro" },
            { icon: Smartphone, text: "Application PWA", subtext: "Hors-ligne inclus" }
          ].map((item, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex p-3 rounded-xl bg-gray-100 dark:bg-gray-800 mb-3 group-hover:scale-110 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-indigo-500 group-hover:text-white transition-all duration-300">
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.text}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtext}</p>
            </div>
          ))}
        </div>

        {/* FAQ Link */}
        <div className="mt-12 text-center">
          <Link 
            href="#faq" 
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Des questions ? Consultez notre FAQ</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
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
      `}</style>
    </section>
  );
};

export default PricingSection;