"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Head from "next/head";
import ChristmasGiveawayForm from "./components/ChristmasGiveawayForm";
import Footer from "./components/Footer";

function trackEvent(eventName: any) {
  // Placeholder for analytics event tracking
  console.log(`Event tracked: ${eventName}`);
}

export default function Home() {
  const [showNewsletter, setShowNewsletter] = useState(false);

  useEffect(() => {
    // Newsletter Popup nach 30 Sekunden oder bei Mausverlassen anzeigen
    const timer = setTimeout(() => {
      setShowNewsletter(true);
    }, 30000);

    const handleMouseLeave = (e: { clientY: number; }) => {
      if (e.clientY <= 0) {
        setShowNewsletter(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const scrollToHero = () => {
    document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Head>
        <title>Weihnachts-Gewinnspiel - Sweets aus aller Welt</title>
        <meta
          name="description"
          content="Mach mit bei unserem Weihnachts-Gewinnspiel 2025! Gewinne tolle Preise rund um Süßigkeiten aus aller Welt. Kostenlose Teilnahme!"
        />
        <meta
          name="keywords"
          content="gewinnspiel, weihnachten, adventskalender, süßigkeiten, snacks, sweets aus aller welt"
        />
        <meta
          property="og:title"
          content="Weihnachts-Gewinnspiel 2025 - Sweets aus aller Welt"
        />
        <meta
          property="og:description"
          content="Jetzt mitmachen und tolle Preise gewinnen! Kostenlose Teilnahme am Weihnachts-Gewinnspiel."
        />
        <meta property="og:image" content="/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Christmas Giveaway Form */}
      <ChristmasGiveawayForm />

      {/* Footer Komponente */}
      <Footer />
    </>
  );
}