'use client'

import React from "react";
import HeroSection from "../components/Hero";
import { Features } from "../components/Features";
import Steps from "../components/Steps";
import CtaSection from "../components/CTA";
import PricingSection from "../components/PricingSection";
import Testimonials from "../components/Testimonials";
import LastCTA from "../components/LastCTA";
import Footer from "../components/Footer";


export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <Features />
      <Steps />
      <CtaSection />
      <PricingSection />
      <Testimonials />
      <LastCTA />
      <Footer />
    </div>
  );
}
