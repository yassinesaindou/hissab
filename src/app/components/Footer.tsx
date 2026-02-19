'use client'

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  FaFacebook, 
  FaInstagram, 
  FaLinkedin, 
  FaWhatsapp,
  FaTwitter,
} from "react-icons/fa";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ArrowRight,
  Heart,
  
  Shield,
  Zap,
  ChevronUp
} from "lucide-react";

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { href: "#home", label: "Accueil", icon: "🏠" },
    { href: "#features", label: "Fonctionnalités", icon: "✨" },
    { href: "#steps", label: "Comment ça marche", icon: "📝" },
    { href: "#pricing", label: "Tarifs", icon: "💰" },
    { href: "#testimonials", label: "Témoignages", icon: "💬" },
    { href: "#contact", label: "Contact", icon: "📞" },
  ];

  const socialLinks = [
    { icon: FaFacebook, href: "https://facebook.com/hissab", label: "Facebook", bgColor: "hover:bg-[#1877F2]", textColor: "text-[#1877F2] hover:text-white" },
    { icon: FaInstagram, href: "https://instagram.com/hissab", label: "Instagram", bgColor: "hover:bg-[#E4405F]", textColor: "text-[#E4405F] hover:text-white" },
    { icon: FaLinkedin, href: "https://linkedin.com/company/hissab", label: "LinkedIn", bgColor: "hover:bg-[#0A66C2]", textColor: "text-[#0A66C2] hover:text-white" },
    { icon: FaTwitter, href: "https://twitter.com/hissab", label: "Twitter", bgColor: "hover:bg-[#1DA1F2]", textColor: "text-[#1DA1F2] hover:text-white" },
    { icon: FaWhatsapp, href: "https://wa.me/2693594256", label: "WhatsApp", bgColor: "hover:bg-[#25D366]", textColor: "text-[#25D366] hover:text-white" },
  ];

  const features = [
    { icon: Shield, text: "Paiement sécurisé", color: "text-blue-500" },
    { icon: Clock, text: "Support 24/7", color: "text-emerald-500" },
    { icon: Zap, text: "Mises à jour gratuites", color: "text-purple-500" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 text-gray-600 dark:text-gray-400 transition-colors duration-300 overflow-hidden">
      
      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-bounce"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          opacity: 0.4
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 md:px-6 lg:px-8 relative">
        {/* Main footer grid */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 relative">
          
          {/* Logo and description */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative">
              <div className="relative inline-block mb-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition"></div>
                <Image
                  src="/Hissab_logo.png"
                  alt="Hissab Logo"
                  width={140}
                  height={45}
                  className="relative"
                />
              </div>
              
              <p className="mb-6 text-gray-600 dark:text-gray-400 leading-relaxed">
                Simplifiez la gestion de votre commerce avec notre solution POS tout-en-un. 
                Ventes, stocks, factures et clients, le tout dans une seule application.
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-3">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                      <Icon className={`w-3 h-3 ${feature.color}`} />
                      <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
              Liens Rapides
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></span>
            </h3>
            <nav className="space-y-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-1"
                >
                  <span className="text-sm opacity-50 group-hover:opacity-100 transition-opacity">
                    {link.icon}
                  </span>
                  <span className="text-sm font-medium">{link.label}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
              Nous Contacter
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></span>
            </h3>
            <address className="space-y-4 text-sm not-italic">
              <div className="group flex items-start gap-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Ouani</p>
                  <p className="text-gray-600 dark:text-gray-400">Anjouan, Comores</p>
                </div>
              </div>
              
              <div className="group flex items-center gap-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <a href="tel:+2694125279" className="hover:underline">
                  +269 4125279
                </a>
              </div>
              
              <div className="group flex items-center gap-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform">
                  <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <a href="mailto:yassinesaindou12@gmail.com" className="hover:underline">
                  yassinesaindou12@gmail.com
                </a>
              </div>
            </address>
          </div>

          {/* Socials & Newsletter */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
              Suivez-nous
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></span>
            </h3>
            
            {/* Social icons with fixed hover colors */}
            <div className="flex flex-wrap gap-3 mb-6">
              {socialLinks.map((social, idx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`p-3 rounded-xl bg-gray-100 dark:bg-gray-800 ${social.textColor} ${social.bgColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>

         
          </div>
        </div>

        {/* Bottom bar with stats */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: "20+", label: "Commerçants", color: "blue" },
              { value: "3k+", label: "Transactions", color: "emerald" },
              { value: "98%", label: "Satisfaction", color: "purple" },
              { value: "24/7", label: "Support", color: "amber" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className={`text-xl font-bold bg-gradient-to-r from-${stat.color}-600 to-${stat.color}-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row">
            <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
              © 2025 Hissab Comores. 
              <span className="flex items-center gap-1 mx-1">
                Fait avec <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> 
              </span>
              aux Comores
            </p>
            
            <nav className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Conditions
              </Link>
              <a 
                href={`https://wa.me/+2693594256?text=${encodeURIComponent("Bonjour ! Je souhaite utiliser vos services de développement de site.")}`}
                className="group flex items-center gap-1 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Développé par Yassine
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </a>
            </nav>
          </div>
        </div>

        {/* Floating shapes */}
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-float animation-delay-2000"></div>
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
}