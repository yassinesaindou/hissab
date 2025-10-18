import * as React from "react";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo et description */}
          <div className="relative">
            <Image
              src="/Hissab_logo.png"
              alt="Hissab Logo"
              width={120}
              height={40}
              className="mb-4"
            />
            <p className="mb-6 text-muted-foreground">
              Gérez vos ventes, factures et clients facilement avec Hissab POS.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Liens Rapides</h3>
            <nav className="space-y-2 text-sm">
              <a href="#home" className="block transition-colors hover:text-primary">
                Accueil
              </a>
              <a href="#features" className="block transition-colors hover:text-primary">
                Fonctionnalités
              </a>
              <a href="#steps" className="block transition-colors hover:text-primary">
                Étapes
              </a>
              <a href="#pricing" className="block transition-colors hover:text-primary">
                Tarifs
              </a>
              <a href="#testimonials" className="block transition-colors hover:text-primary">
                Témoignages
              </a>
              <a href="#contact" className="block transition-colors hover:text-primary">
                Contact
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Nous Contacter</h3>
            <address className="space-y-2 text-sm not-italic">
              <p>Ouani</p>
              <p>Anjouan, Comores</p>
              <p>Tél : +269 4125279</p>
              <p>Email : yassinesaindou12@gmail.com</p>
            </address>
          </div>

          {/* Socials */}
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">Suivez-nous</h3>
            <div className="flex items-center space-x-4">
              <FaFacebook size={24} className="cursor-pointer hover:text-primary" />
              <FaInstagram size={24} className="cursor-pointer hover:text-primary" />
              <FaLinkedin size={24} className="cursor-pointer hover:text-primary" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2025 Hissab Comores. Tous droits réservés.
          </p>
          <nav className="flex gap-4 text-sm">
            <a href={`https://wa.me/+2693594256?text=${encodeURIComponent("Bonjour ! Je souhaite utiliser vos services de développement de site.")}`} className="transition-colors hover:text-primary">
              Développé par Yassine
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
