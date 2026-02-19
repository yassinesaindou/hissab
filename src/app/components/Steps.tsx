"use client"
import { User, Store, Activity, ArrowRight, CheckCircle, Sparkles, Rocket, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const steps = [
  {
    title: "Créez votre compte",
    description: "Inscrivez-vous gratuitement en 2 minutes. Aucune carte bancaire requise.",
    icon: <User className="w-8 h-8" />,
    color: "from-blue-500 to-cyan-500",
    lightColor: "bg-blue-100 dark:bg-blue-900/30",
    stats: "Déjà 20+ commerçants",
    features: ["Email & mot de passe", "Essai 14 jours", "Support dédié"]
  },
  {
    title: "Configurez votre boutique",
    description: "Ajoutez vos produits, importez vos stocks et personnalisez votre espace de vente.",
    icon: <Store className="w-8 h-8" />,
    color: "from-emerald-500 to-teal-500",
    lightColor: "bg-emerald-100 dark:bg-emerald-900/30",
    stats: "En moyenne 5 min",
    features: ["Produits et stocks", "Catégories", "Prix personnalisés"]
  },
  {
    title: "Commencez à vendre",
    description: "Créez vos premières factures, suivez vos ventes et développez votre activité.",
    icon: <Activity className="w-8 h-8" />,
    color: "from-purple-500 to-pink-500",
    lightColor: "bg-purple-100 dark:bg-purple-900/30",
    stats: "Ventes en temps réel",
    features: ["Factures et paiements", "Suivi des ventes", "Rapports avancés"]
  }
];

export default function Steps() {
  const [activeStep, setActiveStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <section id="steps" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl"></div>
        
        {/* Dots pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, gray 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          opacity: 0.1
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with animated badge */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-4 py-2 mb-6">
            <Rocket className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-bounce" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              3 étapes simples
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Commencez en
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent ml-2">
              5 minutes
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Rejoignez des milliers de commerçants qui ont déjà simplifié leur gestion avec Hissab.
          </p>

          {/* Floating time badge */}
          <div className="absolute -top-4 -right-4 hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Configuration express</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps with connecting line */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line (hidden on mobile) */}
          <div className="absolute top-24 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
          </div>

          {/* Steps grid */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`group relative transition-all duration-500 ${
                  activeStep === index ? 'scale-105' : 'scale-100'
                }`}
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Step number badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className={`relative w-8 h-8 rounded-full bg-gradient-to-r ${step.color} text-white flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-110 transition-transform`}>
                    {index + 1}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.color} blur-lg opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                  </div>
                </div>

                {/* Main card */}
                <div className={`relative bg-white dark:bg-gray-900 rounded-2xl p-8 pt-10 shadow-lg border-2 transition-all duration-300 ${
                  activeStep === index 
                    ? `border-transparent bg-gradient-to-r ${step.color} bg-clip-border`
                    : 'border-gray-200 dark:border-gray-800'
                }`}>
                  
                  {/* Inner content */}
                  <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
                    {/* Icon with gradient */}
                    <div className="relative mb-6 flex justify-center">
                      <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                      <div className={`relative w-20 h-20 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        {step.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-center mb-3 text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-4 text-sm">
                      {step.description}
                    </p>

                    {/* Stats badge */}
                    <div className="flex justify-center mb-4">
                      <div className={`inline-flex items-center gap-1 ${step.lightColor} px-3 py-1 rounded-full text-xs font-semibold`}>
                        <CheckCircle className={`w-3 h-3 text-${step.color.split('-')[1]}-600`} />
                        <span className={`bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                          {step.stats}
                        </span>
                      </div>
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-2 mb-6">
                      {step.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color}`}></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA for this step */}
                    <button className={`w-full py-2 px-4 rounded-lg bg-gradient-to-r ${step.color} text-white font-medium text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex items-center justify-center gap-2`}>
                      {index === 0 ? "Créer un compte" : index === 1 ? "Configurer" : "Commencer à vendre"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Animated indicator for active step */}
                {activeStep === index && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Prêt à transformer votre gestion ?
              </span>
            </div>
            <button className="group relative px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5">
              <span className="flex items-center gap-2">
                Démarrer maintenant
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-40 left-10 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl animate-float hidden lg:block"></div>
      <div className="absolute bottom-40 right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-float animation-delay-2000 hidden lg:block"></div>

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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </section>
  );
}