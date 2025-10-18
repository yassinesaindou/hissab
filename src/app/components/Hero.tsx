"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const Navbar = () => {
  const [navIsOpened, setNavIsOpened] = useState(false)
  const closeNavbar = () => setNavIsOpened(false)
  const toggleNavbar = () => setNavIsOpened(navIsOpened => !navIsOpened)

  return (
    <>
      <div aria-hidden={true} onClick={closeNavbar} className={`fixed bg-gray-800/40 inset-0 z-30 ${navIsOpened ? "lg:hidden" : "hidden lg:hidden"}`} />
      <header className="fixed top-0 w-full flex items-center h-20 border-b border-b-gray-100 dark:border-b-gray-900 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-filter backdrop-blur-xl">
        <nav className="relative mx-auto lg:max-w-7xl w-full px-5 sm:px-10 md:px-12 lg:px-5 flex gap-x-5 justify-between items-center">
          <div className="flex items-center min-w-max">
            <Link href="/" className="relative flex items-center gap-2.5">
              
              <span className="inline-flex text-lg font-bold text-blue-950 dark:text-white">
                <Image src="/Hissab_logo.png" width={120} height={30} alt="Hissab" />
              </span>
            </Link>
          </div>
          <div className={`absolute top-full left-0 bg-white dark:bg-gray-950 lg:bg-transparent border-b border-gray-200 dark:border-gray-800 py-8 lg:py-0 px-5 sm:px-10 md:px-12 lg:px-0 lg:border-none w-full lg:top-0 lg:relative lg:w-max lg:flex lg:transition-none duration-300 ease-linear gap-x-6 ${navIsOpened ? "visible opacity-100 translate-y-0" : "translate-y-10 opacity-0 invisible lg:visible lg:translate-y-0 lg:opacity-100"}`}>
            <ul className="flex flex-col lg:flex-row gap-6 lg:items-center text-gray-700 dark:text-gray-300 lg:w-full lg:justify-center">
              <li onClick={closeNavbar}><Link  href="#features" className="relative py-2.5 duration-300 ease-linear hover:text-blue-600">Fonctionnalités</Link></li>
              <li onClick={closeNavbar}><Link  href="#steps" className="relative py-2.5 duration-300 ease-linear hover:text-blue-600">Étapes</Link></li>
              <li onClick={closeNavbar}><Link  href="#pricing" className="relative py-2.5 duration-300 ease-linear hover:text-blue-600">Tarifs</Link></li>
              <li onClick={closeNavbar}><Link  href="#testimonials" className="relative py-2.5 duration-300 ease-linear hover:text-blue-600">Témoignages</Link></li>
            
              <li onClick={closeNavbar}><Link  href="/signup" className="relative py-2.5 duration-300 ease-linear text-blue-600 hover:text-blue-700">Inscription</Link></li>
            </ul>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:min-w-max mt-10 lg:mt-0">
              <Link  href="/login" className="relative flex justify-center px-6 py-3 before:absolute before:inset-0 before:rounded-lg before:transition before:bg-blue-600 dark:before:bg-gray-900 text-blue-100 dark:text-white hover:before:scale-105">
                <span className="relative" onClick={closeNavbar}>Connexion</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center lg:hidden">
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
  return (
    <section className='pb-8 lg:pb-16'>
      <Navbar />
      <main className="w-full mt-8 lg:mt-16">
        <section className="relative pt-10 xl:pt-14">
          <div className="mx-auto lg:max-w-7xl w-full px-5 sm:px-10 md:px-12 lg:px-5 flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12">
            <div className="mx-auto text-center lg:text-left flex flex-col max-w-3xl justify-center lg:justify-start lg:py-8 flex-1 lg:w-1/2 lg:max-w-none">
              <h1 className="text-blue-950 dark:text-white text-4xl/snug sm:text-6xl/tight lg:text-5xl/tight xl:text-6xl/tight font-semibold">
                Suivez Chaque Centime <span className="bg-blue-50 dark:bg-gray-900 dark:text-blue-300 inline-block border border-dashed border-blue-600 px-3">Vos boutiques à portée de main</span>
              </h1>
              <p className="mt-10 text-gray-700 dark:text-gray-300 lg:text-lg max-w-2xl lg:max-w-none mx-auto">
                Gérez facilement vos ventes, suivez vos stocks et optimisez vos revenus avec notre solution POS simple et puissante, conçue pour les commerçants.
              </p>
              <div className="mt-10 flex gap-4 justify-center lg:justify-start flex-wrap">
                <Link href="/login" className="relative px-6 py-3 before:absolute before:inset-0 before:rounded-lg before:transition active:before:bg-blue-700 text-white hover:before:bg-blue-800 before:bg-blue-600 hover:before:scale-105">
                  <span className="relative">Connexion</span>
                </Link>
                <Link href="/signup" className="relative px-6 py-3 before:absolute before:inset-0  before:transition border border-blue-600 before:rounded-lg before:bg-gray-100 dark:before:bg-gray-900 text-blue-600 dark:text-white hover:before:scale-105 rounded-lg">
                  <span className="relative">Inscription</span>
                </Link>
              </div>
            </div>
            <div className="flex flex-1 lg:w-1/2 relative max-w-3xl mx-auto lg:max-w-none">
              <Image src="/heroImage.jpg" alt="équipe heureuse" width={1850} height={1200} className="lg:absolute rounded-lg w-full lg:inset-x-0 object-cover lg:h-full" />
            </div>
          </div>
        </section>
      </main>
    </section>
  )
}
