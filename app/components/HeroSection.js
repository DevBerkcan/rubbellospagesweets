"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mail, User, MapPin, ChevronRight, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { FunnelTracker } from "../../lib/funnel";
import { trackEvent } from "../../lib/tracking";
import Image from "next/image";

export default function HeroSection({ onCTAClick }) {
  const [step, setStep] = useState("contact");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    postalCode: "",
    country: "DE"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [vh, setVh] = useState(800);
  const [particleCount, setParticleCount] = useState(10);
  const [remainingSpots, setRemainingSpots] = useState(100);
  const prefersReducedMotion = useReducedMotion();
  const submittedRef = useRef(false);

  const currentOffer = { title: "Dubai-Schokolade", emoji: "🍫" };

  const contactForm = useForm({ mode: "onSubmit", reValidateMode: "onBlur" });
  const addressForm = useForm({ mode: "onSubmit", reValidateMode: "onBlur" });

  const funnel = useMemo(() => new FunnelTracker(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateVh = () => setVh(window.innerHeight);
    updateVh();
    window.addEventListener("resize", updateVh);

    const mq = window.matchMedia("(max-width: 768px)");
    const setCount = () => setParticleCount(mq.matches ? 5 : 10);
    setCount();
    mq.addEventListener?.("change", setCount);

    setRemainingSpots(Math.floor(Math.random() * 81) + 20);

    return () => {
      window.removeEventListener("resize", updateVh);
      mq.removeEventListener?.("change", setCount);
    };
  }, []);

  const seeds = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const rng = (x) => {
        const t = Math.sin((i + 1) * 9301 + x * 49297) * 233280;
        return t - Math.floor(t);
      };
      return {
        leftPct: rng(1) * 100,
        delay: rng(2) * 8,
        duration: 8 + rng(3) * 4,
        xDrift: Math.sin(i) * 100,
      };
    });
  }, [particleCount]);

  const sweetImages = ["/test.svg", "/test.svg", "/test.svg"];

  const getUTMParameter = (param) => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(param);
  };

  const callNewsletterAPI = async (data) => {
    return fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        source: "hero_offer",
        offer: currentOffer.title,
        utm_source: getUTMParameter("utm_source") || "direct",
        utm_medium: getUTMParameter("utm_medium") || "organic",
        utm_campaign: getUTMParameter("utm_campaign") || "default",
        statusIfNew: "subscribed",
      }),
    });
  };

  const onSubmitContact = async (data) => {
    if (isLoading || submittedRef.current) return;
    setIsLoading(true);

    try {
      submittedRef.current = true;
      funnel.trackEmailCapture(data.email);
      trackEvent("lead_form_start", { source: "hero_section" });

      setFormData(prev => ({
        ...prev,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      }));

      const res = await callNewsletterAPI({ 
        email: data.email, 
        firstName: data.firstName,
        lastName: data.lastName
      });
      
      if (!res.ok) throw new Error("Subscription failed");

      setStep("address");
      submittedRef.current = false;
      trackEvent("newsletter_contact_captured", { method: "hero_section" });
    } catch (error) {
      console.error("Newsletter signup error:", error);
      trackEvent("form_error", { type: "newsletter_signup_contact" });
      submittedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitAddress = async (data) => {
    await completeRegistration(data, true);
  };

  const onSkipAddress = async () => {
    await completeRegistration({}, false);
  };

  const completeRegistration = async (addressData, includeAddress) => {
    setIsLoading(true);
    
    try {
      const finalData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        ...(includeAddress ? addressData : {})
      };

      const res = await callNewsletterAPI(finalData);
      if (!res.ok) throw new Error("Update failed");

      setStep("done");
      trackEvent("complete_registration", { 
        method: "newsletter", 
        value: 1.0, 
        currency: "EUR",
        address_provided: includeAddress 
      });
    } catch (error) {
      console.error("Registration completion error:", error);
      trackEvent("form_error", { type: "newsletter_completion" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToContact = () => {
    setStep("contact");
  };

  if (step === "done") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center max-w-lg mx-auto"
        >
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ duration: 1.5, repeat: Infinity }} 
            className="text-7xl mb-6"
          >
            🎉
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              WILLKOMMEN!
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-6">
            Deine <strong>{currentOffer.title}</strong> ist unterwegs! {currentOffer.emoji}
          </p>
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg">
            <p className="text-base text-gray-600 mb-1">
              📧 Prüfe dein Postfach für Details & deinen exklusiven Rabattcode!
            </p>
            <p className="text-sm text-gray-500">Bitte auch den Spam-Ordner prüfen.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 overflow-hidden px-4 py-8">
      {/* Mittlere fallende Bilder */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {seeds.map((s, i) => (
            <motion.div
              key={i}
              className="absolute"
              animate={{ 
                y: [-100, vh + 100], 
                x: [0, s.xDrift], 
                rotate: [0, 360] 
              }}
              transition={{ 
                duration: s.duration, 
                repeat: Infinity, 
                ease: "linear", 
                delay: s.delay 
              }}
              style={{ 
                left: `${s.leftPct}%`, 
                top: "-100px" 
              }}
            >
              <img
                src={sweetImages[i % sweetImages.length]}
                alt="Süßigkeit"
                className="w-24 h-24 md:w-32 md:h-32 opacity-70 object-cover rounded-lg"
                loading="lazy"
                onError={(e) => e.target.style.display = 'none'}
              />
            </motion.div>
          ))}
        </div>
      )}

      <div className="container mx-auto text-center relative z-10 max-w-5xl">
        {/* Mittleres Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex justify-center mb-8"
        >
          <div className="relative w-20 h-20 md:w-28 md:h-28">
            <Image
              src="/sweeetts.svg"
              alt="Sweets aus aller Welt – Logo"
              fill
              priority
              className="object-contain drop-shadow-lg"
              sizes="(max-width: 768px) 80px, 112px"
            />
          </div>
        </motion.div>

        {/* Mittlerer Content */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7 }}
          className="space-y-8"
        >
          {/* KLEINERE Headline */}
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight"
            >
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                SÜSSIGKEITEN
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">AUS ALLER</span>
              <br />
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                WELT! 🌍
              </span>
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.15 }}
              className="space-y-2 max-w-3xl mx-auto"
            >
              <p className="text-lg md:text-xl text-gray-800 font-bold leading-relaxed">
                Der süßesten Community der Welt beitreten – <span className="text-pink-600">& gratis Dubai-Schokolade sichern</span> 😍
              </p>
              <p className="text-base md:text-lg text-amber-600 font-semibold">
                Exklusiv für die ersten 100 Communitymitglieder!
              </p>
            </motion.div>
          </div>

          {/* Mittlerer CTA Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.3 }} 
            className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-3 rounded-xl inline-block shadow-lg border border-white/20"
          >
            <span className="font-bold text-lg md:text-xl drop-shadow-sm">
              🔥 Nur noch {remainingSpots} Gratis-{currentOffer.title} verfügbar!
            </span>
          </motion.div>

          {/* Mittleres Form */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }} 
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30">
              
              {/* Contact Step */}
              {step === "contact" && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 drop-shadow-sm">
                    🎁 Deine süße Reise beginnt hier!
                  </h3>
                  
                  <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                    {/* Vorname */}
                    <div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Dein Vorname"
                          {...contactForm.register("firstName", {
                            required: "Vorname ist erforderlich",
                            minLength: { value: 2, message: "Mindestens 2 Zeichen" }
                          })}
                          className="w-full pl-12 pr-6 py-4 text-base border-2 border-white/30 bg-white/40 backdrop-blur-sm rounded-xl focus:border-pink-500 focus:bg-white/60 focus:outline-none transition-all placeholder:text-gray-600"
                        />
                      </div>
                      {contactForm.formState.errors.firstName && (
                        <p className="text-red-600 text-sm mt-2 text-left font-medium">
                          {contactForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    {/* Nachname */}
                    <div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Dein Nachname"
                          {...contactForm.register("lastName", {
                            required: "Nachname ist erforderlich",
                            minLength: { value: 2, message: "Mindestens 2 Zeichen" }
                          })}
                          className="w-full pl-12 pr-6 py-4 text-base border-2 border-white/30 bg-white/40 backdrop-blur-sm rounded-xl focus:border-pink-500 focus:bg-white/60 focus:outline-none transition-all placeholder:text-gray-600"
                        />
                      </div>
                      {contactForm.formState.errors.lastName && (
                        <p className="text-red-600 text-sm mt-2 text-left font-medium">
                          {contactForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>

                    {/* E-Mail */}
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="email"
                          placeholder="Deine E-Mail Adresse"
                          {...contactForm.register("email", {
                            required: "E-Mail ist erforderlich",
                            pattern: { 
                              value: /\S+@\S+\.\S+/, 
                              message: "Bitte gib eine gültige E-Mail Adresse ein" 
                            },
                          })}
                          className="w-full pl-12 pr-6 py-4 text-base border-2 border-white/30 bg-white/40 backdrop-blur-sm rounded-xl focus:border-pink-500 focus:bg-white/60 focus:outline-none transition-all placeholder:text-gray-600"
                        />
                      </div>
                      {contactForm.formState.errors.email && (
                        <p className="text-red-600 text-sm mt-2 text-left font-medium">
                          {contactForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-base"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          Wird verarbeitet...
                        </>
                      ) : (
                        <>
                          Jetzt anmelden & Schokolade sichern!
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </form>
                  
                  <p className="text-xs text-gray-700 mt-4 text-center drop-shadow-sm">
                    🔒 100% kostenlos • Jederzeit abbestellbar • Keine Spam-Mails
                  </p>
                </motion.div>
              )}

              {/* Address Step */}
              {step === "address" && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">📍</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">Lieferadresse</h3>
                    <p className="text-gray-700 drop-shadow-sm">Diese Angaben sind optional und können übersprungen werden</p>
                  </div>
                  
                  <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4">
                    {/* Straße */}
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Straße und Hausnummer"
                        {...addressForm.register("street")}
                        className="w-full pl-12 pr-6 py-3 text-base border-2 border-white/30 bg-white/40 backdrop-blur-sm rounded-xl focus:border-pink-500 focus:bg-white/60 focus:outline-none transition-all placeholder:text-gray-600"
                      />
                    </div>

                    {/* PLZ & Stadt */}
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="PLZ"
                        {...addressForm.register("postalCode")}
                        className="w-full px-4 py-3 text-base border-2 border-white/30 bg-white/40 backdrop-blur-sm rounded-xl focus:border-pink-500 focus:bg-white/60 focus:outline-none transition-all placeholder:text-gray-600"
                      />
                      <input
                        type="text"
                        placeholder="Stadt"
                        {...addressForm.register("city")}
                        className="w-full px-4 py-3 text-base border-2 border-white/30 bg-white/40 backdrop-blur-sm rounded-xl focus:border-pink-500 focus:bg-white/60 focus:outline-none transition-all placeholder:text-gray-600"
                      />
                    </div>

                    {/* Land */}
                    <select
                      {...addressForm.register("country")}
                      className="w-full px-4 py-3 text-base border-2 border-white/30 bg-white/40 backdrop-blur-sm rounded-xl focus:border-pink-500 focus:bg-white/60 focus:outline-none transition-all"
                    >
                      <option value="DE">Deutschland</option>
                      <option value="AT">Österreich</option>
                      <option value="CH">Schweiz</option>
                    </select>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <motion.button
                        type="button"
                        onClick={handleBackToContact}
                        className="flex-1 bg-gray-400 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-500 transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Zurück
                      </motion.button>
                      
                      <motion.button
                        type="button"
                        onClick={onSkipAddress}
                        disabled={isLoading}
                        className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-600 transition-all disabled:opacity-70"
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      >
                        {isLoading ? "Lädt..." : "Überspringen"}
                      </motion.button>
                      
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-70"
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      >
                        {isLoading ? "Lädt..." : "Fertig! 🍫"}
                      </motion.button>
                    </div>
                  </form>
                  
                  <p className="text-xs text-gray-700 mt-4 text-center drop-shadow-sm">
                    Du kannst die Adresse auch später noch hinzufügen
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}