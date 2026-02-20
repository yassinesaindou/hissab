/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Moon,
  Package,
  PlusCircle,
  Receipt,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// PlayCircle component 

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = "", duration = 2000 }: { value: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value, duration])
  
  return <span>{count.toLocaleString()}{suffix}</span>
}

const Navbar = () => {
  const [navIsOpened, setNavIsOpened] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const closeNavbar = () => setNavIsOpened(false)
  const toggleNavbar = () => setNavIsOpened(navIsOpened => !navIsOpened)

  return (
    <>
      <div aria-hidden={true} onClick={closeNavbar} className={`fixed bg-gray-800/40 inset-0 z-30 ${navIsOpened ? "lg:hidden" : "hidden lg:hidden"}`} />
      <header className={`fixed top-0 w-full flex items-center h-20 z-40 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <nav className="relative mx-auto lg:max-w-7xl w-full px-5 sm:px-10 md:px-12 lg:px-5 flex gap-x-5 justify-between items-center">
          <div className="flex items-center min-w-max">
            <Link prefetch={false} href="/" className="relative flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-xl opacity-0 group-hover:opacity-40 transition-all duration-500"></div>
                <Image src="/Hissab_logo.png" width={130} height={35} alt="Hissab" className="relative" />
              </div>
            </Link>
          </div>
          
          <div className={`absolute top-full left-0 bg-white dark:bg-gray-950 lg:bg-transparent border-b border-gray-200 dark:border-gray-800 py-8 lg:py-0 px-5 sm:px-10 md:px-12 lg:px-0 lg:border-none w-full lg:top-0 lg:relative lg:w-max lg:flex lg:transition-none duration-300 ease-linear gap-x-6 ${navIsOpened ? "visible opacity-100 translate-y-0" : "translate-y-10 opacity-0 invisible lg:visible lg:translate-y-0 lg:opacity-100"}`}>
            <ul className="flex flex-col lg:flex-row gap-6 lg:items-center text-gray-700 dark:text-gray-300 lg:w-full lg:justify-center">
              {[
                { href: "#features", label: "Fonctionnalités" },
                { href: "#steps", label: "Comment ça marche" },
                { href: "#pricing", label: "Tarifs" },
                { href: "#testimonials", label: "Témoignages" }
              ].map((item) => (
                <li key={item.href} onClick={closeNavbar}>
                  <Link 
                    href={item.href} 
                    className="relative py-2.5 px-3 duration-300 ease-linear hover:text-blue-600 font-medium group"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-1/2 group-hover:left-0 transition-all duration-300"></span>
                    <span className="absolute bottom-0 right-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-1/2 group-hover:right-0 transition-all duration-300"></span>
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:min-w-max mt-10 lg:mt-0">
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <Link 
                href="/login" 
                className="group relative px-6 py-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all duration-300 hover:-translate-y-0.5"
                onClick={closeNavbar}
              >
                <span className="relative flex items-center gap-2">
                  Connexion
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center lg:hidden gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={toggleNavbar} aria-label='toggle navbar' className="outline-none border-l border-l-blue-100 dark:border-l-gray-800 pl-3 relative py-3">
              <span aria-hidden={true} className={`flex h-0.5 w-6 rounded bg-gray-800 dark:bg-gray-300 transition duration-300 ${navIsOpened ? "rotate-45 translate-y-[.324rem]" : ""}`} />
              <span aria-hidden={true} className={`mt-2 flex h-0.5 w-6 rounded bg-gray-800 dark:bg-gray-300 transition duration-300 ${navIsOpened ? "-rotate-45 -translate-y-[.324rem]" : ""}`} />
            </button>
          </div>
        </nav>
      </header>
    </>
  )
}

export default function HeroSection() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null)

  const stats = [
    { label: "Ventes aujourd'hui", value: 1250000, change: 12.5, icon: TrendingUp, color: "blue" },
    { label: "Revenu net", value: 985000, change: 8.2, icon: Wallet, color: "emerald" },
    { label: "Crédits en cours", value: 450000, change: -3.1, icon: CreditCard, color: "amber" },
    { label: "Produits en stock", value: 234, change: 15, icon: Package, color: "purple" }
  ]

  const recentTransactions = [
    { product: "Café Arabica", amount: 25000, type: "sale", time: "10:30", status: "completed" },
    { product: "Lait entier", amount: 15500, type: "sale", time: "09:45", status: "completed" },
    { product: "Facture électricité", amount: 8000, type: "expense", time: "08:15", status: "pending" }
  ]

  const lowStockItems = [
    { name: "Sucre", stock: 3, threshold: 10 },
    { name: "Huile", stock: 2, threshold: 8 }
  ]

  // New stats for the left column
  const efficiencyStats = [
    { icon: Timer, value: "115h+", label: "temps gagné/mois", color: "blue" },
    { icon: TrendingDown, value: "68%", label: "erreurs en moins", color: "emerald" },
    { icon: Users, value: "35+", label: "employés formés", color: "purple" },
    { icon: Award, value: "99.9%", label: "disponibilité", color: "amber" }
  ]

  return (
    <div className="relative">
      {/* Add animation styles in a regular style tag */}
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
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-y-2 {
          transform: rotateY(2deg);
        }
        .hover\\:rotate-y-2:hover {
          transform: rotateY(2deg);
        }
      `}</style>

      <Navbar />
      
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          opacity: 0.2
        }} />
      </div>

      <main className="w-full mt-8 lg:mt-16">
        <section className="relative pt-10 xl:pt-14">
          <div className="mx-auto lg:max-w-7xl w-full px-5 sm:px-10 md:px-12 lg:px-5 flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12">
            
            {/* Left Column - Text Content */}
            <div className="mx-auto text-center lg:text-left flex flex-col max-w-3xl justify-center lg:justify-start lg:py-8 flex-1 lg:w-1/2 lg:max-w-none">
              {/* Animated Badge */}
              <div className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-5 py-2.5 mb-6 w-fit mx-auto lg:mx-0 hover:scale-105 transition-transform duration-300 cursor-default">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  🚀 Nouveau : Mode hors-ligne et PWA disponibles
                </span>
              </div>

              <h1 className="text-5xl sm:text-7xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Gérez votre
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent relative group">
                  commerce intelligemment
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                </span>
              </h1>
              
              <p className="mt-6 text-gray-600 dark:text-gray-300 text-lg max-w-2xl lg:max-w-none mx-auto leading-relaxed">
                Hissab POS vous offre une solution complète pour gérer vos ventes, 
                suivre vos stocks et analyser vos performances en temps réel, 
                <span className="font-semibold text-blue-600"> même sans connexion internet.</span>
              </p>

              {/* Efficiency Stats Row - NEW */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {efficiencyStats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} className="group/eff relative bg-white dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className={`absolute inset-0 bg-gradient-to-r from-${stat.color}-500/0 via-${stat.color}-500/5 to-${stat.color}-500/0 rounded-xl opacity-0 group-hover/eff:opacity-100 transition-opacity duration-500`}></div>
                      <div className="relative">
                        <div className={`inline-flex p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 mb-2`}>
                          <Icon className={`w-4 h-4 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Feature Pills with Icons */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                {[
                  { icon: Zap, text: "Ventes en 1 clic", color: "blue" },
                  { icon: Package, text: "Stock intelligent", color: "emerald" },
                  { icon: BarChart3, text: "Rapports avancés", color: "purple" },
                  { icon: Smartphone, text: "PWA & Hors-ligne", color: "amber" }
                ].map((feature, index) => (
                  <div 
                    key={index} 
                    className="group relative"
                    onMouseEnter={() => setHoveredStat(index)}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-${feature.color}-600 to-${feature.color}-400 rounded-xl blur opacity-0 group-hover:opacity-50 transition duration-500 ${hoveredStat === index ? 'opacity-50' : ''}`}></div>
                    <div className="relative flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <feature.icon className={`w-3.5 h-3.5 text-${feature.color}-600`} />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{feature.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="mt-6 flex gap-3 justify-between lg:justify-start flex-wrap">
                <Link 
                  prefetch={false} 
                  href="/signup" 
                  className="group relative flex-1 px-6 py-3 bg-transparent border-2 rounded-xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <span className="relative flex text-center justify-around items-center gap-2 text-base">
                    Essai gratuit
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
        <Link 
                  prefetch={false} 
                  href="/login" 
                  className="group relative flex-1 px-6 py-3 bg-transparent border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-blue-600 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <span className="relative flex items-center gap-2 text-base text-center justify-around">
                    Se Connecter
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
                {/* Secondary CTA (voir demo ) - Commented out for now */}
                {/* <Link 
                  prefetch={false} 
                  href="/demo" 
                  className="group relative px-6 py-3 bg-transparent border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-blue-600 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <span className="relative flex items-center gap-2 text-base">
                    Voir la démo
                    <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </span>
                </Link> */}
              </div>

              {/* Trust Badges */}
              <div className="mt-6 flex flex-wrap items-center gap-4 justify-center lg:justify-start">
                {[
                  { icon: CheckCircle, text: "14 jours d'essai", color: "emerald" },
                  { icon: Shield, text: "Sans carte", color: "blue" },
                  { icon: Clock, text: "Annulation libre", color: "purple" }
                ].map((badge, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 group">
                    <div className={`p-0.5 rounded-full bg-${badge.color}-100 dark:bg-${badge.color}-900/30 group-hover:scale-110 transition-transform`}>
                      <badge.icon className={`w-3 h-3 text-${badge.color}-600 dark:text-${badge.color}-400`} />
                    </div>
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>

              {/* Social Proof */}
              <div className="mt-6 flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-[8px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white">20+</span> commerçants
                </div>
              </div>
            </div>

            {/* Right Column - Compact Dashboard Preview */}
            <div className="flex flex-1 lg:w-1/2 relative max-w-2xl mx-auto lg:max-w-none perspective-1000">
              <div className="relative w-full transform-gpu hover:rotate-y-2 transition-transform duration-1000 scale-90 lg:scale-100">
                
                {/* Main Dashboard Card - More Compact */}
                <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden group/dashboard hover:shadow-3xl transition-all duration-700">
                  
                  {/* Animated Gradient Border */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-0 group-hover/dashboard:opacity-30 transition duration-1000 animate-gradient-xy"></div>
                  
                  {/* Header - More Compact */}
                  <div className="relative bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse animation-delay-200"></div>
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse animation-delay-400"></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-full">
                          {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" 
                            placeholder="Rechercher..." 
                            className="pl-7 pr-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 lg:w-32"
                          />
                        </div>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
                          <Bell className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content - More Compact */}
                  <div className="relative p-4 space-y-3">
                    {/* Stats Cards - 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {stats.slice(0, 4).map((stat, i) => {
                        const Icon = stat.icon
                        return (
                          <div 
                            key={i}
                            className="group/stat relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900 p-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-0.5"
                            onMouseEnter={() => setHoveredStat(i)}
                            onMouseLeave={() => setHoveredStat(null)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  <AnimatedCounter value={stat.value} suffix=" F" />
                                </p>
                              </div>
                              <div className={`p-1.5 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                                <Icon className={`w-3 h-3 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                              </div>
                            </div>
                            
                            <div className="mt-1 flex items-center gap-1">
                              <span className={`text-[8px] font-medium ${stat.change > 0 ? 'text-emerald-600' : 'text-red-600'} bg-${stat.change > 0 ? 'emerald' : 'red'}-100 dark:bg-${stat.change > 0 ? 'emerald' : 'red'}-900/30 px-1 rounded-full`}>
                                {stat.change > 0 ? '+' : ''}{stat.change}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Mini Chart and Transactions Row */}
                    <div className="flex gap-2">
                      {/* Mini Chart */}
                      <div className="w-1/3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900 p-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Ventes</h4>
                        <div className="h-12 flex items-end gap-0.5">
                          {[65, 45, 80, 55, 70].map((height, i) => (
                            <div key={i} className="flex-1">
                              <div 
                                className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t"
                                style={{ height: `${height * 0.5}%` }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Transactions - Compact */}
                      <div className="flex-1 space-y-1">
                        <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Receipt className="w-3 h-3 text-blue-600" />
                          Récentes
                        </h4>
                        {recentTransactions.map((tx, i) => (
                          <div key={i} className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-1">
                              <div className={`p-0.5 rounded ${
                                tx.type === 'sale' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {tx.type === 'sale' ? 
                                  <ArrowUpRight className="w-2 h-2 text-emerald-600" /> : 
                                  <ArrowDownRight className="w-2 h-2 text-red-600" />
                                }
                              </div>
                              <span className="text-[9px] text-gray-700 dark:text-gray-300 truncate max-w-[50px]">{tx.product}</span>
                            </div>
                            <span className={`text-[8px] font-medium ${tx.type === 'sale' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {tx.type === 'sale' ? '+' : '-'}{tx.amount/1000}k
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stock Alert - Compact */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-amber-400 rounded-full blur-sm animate-pulse"></div>
                          <div className="relative w-6 h-6 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                            <Package className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[9px] font-semibold text-amber-800 dark:text-amber-300">Stock faible (2)</h4>
                            <button className="text-[7px] bg-amber-600 hover:bg-amber-700 text-white px-1.5 py-0.5 rounded">
                              Commander
                            </button>
                          </div>
                          <div className="flex gap-2 mt-1">
                            {lowStockItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span className="text-[7px] text-amber-700 dark:text-amber-400">{item.name}</span>
                                <span className="text-[7px] font-medium text-amber-800 dark:text-amber-300">{item.stock}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    <button className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-1.5 rounded-lg text-xs font-medium hover:shadow-lg hover:shadow-blue-600/25 transition-all hover:-translate-y-0.5 group">
                      <PlusCircle className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                      Nouvelle vente
                    </button>
                  </div>

                  {/* Status Bar - Ultra Compact */}
                  <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-1.5 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between text-[8px]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-gray-600 dark:text-gray-400">Sync</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-2 h-2 text-yellow-500" />
                          <span className="text-gray-600 dark:text-gray-400">Hors-ligne</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">v2.4</span>
                        <span className="text-emerald-600 font-medium">15 actifs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PWA Badge */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-xl animate-bounce flex items-center gap-1">
                  <Zap className="w-2 h-2" />
                  PWA
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}