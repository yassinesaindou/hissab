/* eslint-disable react/no-unescaped-entities */
'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useState, useEffect } from 'react'
import { 
  Star, 
  Quote, 
  
  TrendingUp, 
  ShoppingBag,
  Heart,
  MessageCircle,
  ThumbsUp,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const testimonials = [
  {
    name: "Ali Madi",
    role: "Propriétaire de magasin",
    content: `Hissab a complètement changé la façon dont je gère mon magasin. 
              La possibilité de suivre les factures, les stocks et les ventes en temps réel m'a fait gagner un temps précieux.`,
    bgColor: "from-blue-500 to-cyan-500",
    rating: 5,
    location: "Moroni",
    sales: "+45% de croissance",
    avatar: "AM"
  },
  {
    name: "Fatima Ahamada",
    role: "Entrepreneur",
    content: "Hissab est super facile à utiliser et très pratique pour suivre toutes mes ventes et factures. L'interface est intuitive et le support client est réactif.",
    bgColor: "from-emerald-500 to-teal-500",
    rating: 5,
    location: "Mitsamiouli",
    sales: "+30% d'efficacité",
    avatar: "FA"
  },
  {
    name: "Youssouf Daho",
    role: "Commerçant",
    content: "Le suivi des ventes avec Hissab m'a permis de mieux comprendre mon business et d'améliorer mes profits. Les rapports détaillés sont un vrai plus.",
    bgColor: "from-purple-500 to-pink-500",
    rating: 5,
    location: "Fomboni",
    sales: "+60% de visibilité",
    avatar: "YD"
  },
  {
    name: "Siti Zaineb",
    role: "Vendeuse",
    content: "Enfin une solution simple pour gérer mon magasin sans tracas. L'application mobile me permet de tout suivre même quand je ne suis pas au magasin.",
    bgColor: "from-orange-500 to-red-500",
    rating: 5,
    location: "Ouani",
    sales: "Gain de temps : 12h/semaine",
    avatar: "SZ"
  }
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden" id='testimonials'>
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with animated badge */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-full px-4 py-2 mb-6">
            <Heart className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Ils nous font confiance
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Ce que disent
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent ml-2">
              nos commerçants
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Rejoignez plus de <span className="font-bold text-blue-600">20 commerçants</span> qui ont déjà transformé leur gestion avec Hissab.
          </p>

          {/* Rating badge */}
          <div className="mt-6 inline-flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-6 py-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">4.9/5</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">(500+ avis)</span>
          </div>
        </div>

        {/* Desktop Grid - Hidden on mobile */}
        <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {testimonials.map((t, idx) => {
            const isHovered = hoveredCard === idx;
            return (
              <div
                key={idx}
                className="group relative"
                onMouseEnter={() => {
                  setHoveredCard(idx);
                  setIsAutoPlaying(false);
                }}
                onMouseLeave={() => {
                  setHoveredCard(null);
                  setIsAutoPlaying(true);
                }}
              >
                {/* Gradient border animation */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${t.bgColor} rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500 ${isHovered ? 'opacity-75' : ''}`}></div>
                
                <Card className="relative h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-2 hover:border-transparent transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Quote icon */}
                  <div className="absolute top-4 right-4 opacity-10">
                    <Quote className="w-12 h-12 text-gray-900 dark:text-white" />
                  </div>

                  <CardContent className="p-6">
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Testimonial content */}
                    <blockquote className="mb-6">
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        "{t.content}"
                      </p>
                    </blockquote>

                    {/* Stats badge */}
                    <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${t.bgColor} bg-opacity-10 px-3 py-1 rounded-full text-xs font-semibold mb-4`}>
                      <TrendingUp className={`w-3 h-3 text-${t.bgColor.split('-')[1]}-600`} />
                      <span className={`bg-gradient-to-r ${t.bgColor} bg-clip-text text-transparent`}>
                        {t.sales}
                      </span>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
                        <AvatarFallback className={`bg-gradient-to-r ${t.bgColor} text-white font-semibold`}>
                          {t.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <cite className="text-sm font-bold text-gray-900 dark:text-white not-italic">
                          {t.name}
                        </cite>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{t.role}</span>
                          <span>•</span>
                          <span>{t.location}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Mobile Carousel - Visible only on mobile */}
        <div className="md:hidden relative mb-8">
          {/* Main testimonial card */}
          <div className="relative group">
            {/* Gradient border animation */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${testimonials[activeIndex].bgColor} rounded-2xl blur opacity-75`}></div>
            
            <Card className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-2 border-transparent overflow-hidden">
              {/* Quote icon */}
              <div className="absolute top-4 right-4 opacity-10">
                <Quote className="w-16 h-16 text-gray-900 dark:text-white" />
              </div>

              <CardContent className="p-8">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial content */}
                <blockquote className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                    "{testimonials[activeIndex].content}"
                  </p>
                </blockquote>

                {/* Stats badge */}
                <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${testimonials[activeIndex].bgColor} bg-opacity-10 px-3 py-1.5 rounded-full text-sm font-semibold mb-4`}>
                  <TrendingUp className={`w-4 h-4 text-${testimonials[activeIndex].bgColor.split('-')[1]}-600`} />
                  <span className={`bg-gradient-to-r ${testimonials[activeIndex].bgColor} bg-clip-text text-transparent`}>
                    {testimonials[activeIndex].sales}
                  </span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <Avatar className="size-14 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
                    <AvatarFallback className={`bg-gradient-to-r ${testimonials[activeIndex].bgColor} text-white font-bold text-lg`}>
                      {testimonials[activeIndex].avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="text-base font-bold text-gray-900 dark:text-white not-italic">
                      {testimonials[activeIndex].name}
                    </cite>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{testimonials[activeIndex].role}</span>
                      <span>•</span>
                      <span>{testimonials[activeIndex].location}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carousel controls */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevTestimonial}
              className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-x-1"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots indicator */}
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveIndex(idx);
                    setIsAutoPlaying(false);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeIndex 
                      ? `w-8 bg-gradient-to-r ${testimonials[idx].bgColor}` 
                      : 'w-2 bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:translate-x-1"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { icon: MessageCircle, value: "500+", label: "Avis clients", color: "blue" },
            { icon: ThumbsUp, value: "98%", label: "Satisfaction", color: "emerald" },
            { icon: Award, value: "4.9/5", label: "Note moyenne", color: "purple" },
            { icon: ShoppingBag, value: "0.02k+", label: "Commerçants", color: "amber" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center group">
              <div className={`inline-flex p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30 mb-2 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          {[
            "Interface intuitive",
            "Support réactif",
            "Mises à jour gratuites",
            "Sécurité garantie"
          ].map((badge, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
              {badge}
            </div>
          ))}
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
  )
}