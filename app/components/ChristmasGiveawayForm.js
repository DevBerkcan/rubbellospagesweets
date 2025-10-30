"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mail, User, MapPin, Phone, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";

export default function ChristmasGiveawayForm() {
  const [step, setStep] = useState("form");

  // States
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [vh, setVh] = useState(800);
  const [particleCount, setParticleCount] = useState(10);
  const prefersReducedMotion = useReducedMotion();
  const submittedRef = useRef(false);

  const contactForm = useForm({ mode: "onSubmit", reValidateMode: "onBlur" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateVh = () => setVh(window.innerHeight);
    updateVh();
    window.addEventListener("resize", updateVh);

    const mq = window.matchMedia("(max-width: 768px)");
    const setCount = () => setParticleCount(mq.matches ? 5 : 10);
    setCount();
    mq.addEventListener?.("change", setCount);

    return () => {
      window.removeEventListener("resize", updateVh);
      mq.removeEventListener?.("change", setCount);
    };
  }, []);

  const seeds = useMemo(() => {
    const count = (typeof particleCount === "number" && particleCount > 0) ? particleCount : 10;
    return Array.from({ length: count }, (_, i) => {
      const rng = (x) => {
        const t = Math.sin((i + 1) * 9301 + x * 49297) * 233280;
        return t - Math.floor(t);
      };
      return {
        leftPct: rng(1) * 100,
        delay: rng(2) * 8,
        duration: 8 + rng(3) * 4,
        xDrift: Math.sin(i) * 100
      };
    });
  }, [particleCount]);

  // Weihnachtliche Bilder für Animation
  const christmasImages = ["🎄", "❄️", "🎁", "⭐", "🔔", "🎅"];

  const getUTMParameter = (param) => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(param);
  };

  // API Call für Gewinnspiel (OHNE Code)
  const callGiveawayAPI = async (data) => {
    return fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        source: "rubbellos",
        offer: "Adventskalender 2025",
        utm_source: getUTMParameter("utm_source") || "direct",
        utm_medium: getUTMParameter("utm_medium") || "organic",
        utm_campaign: getUTMParameter("utm_campaign") || "rubbellos_2025",
        statusIfNew: newsletterOptIn ? "pending" : "transactional",
        consent: true,
        consentTs: new Date().toISOString(),
      }),
    });
  };

  const onSubmitContact = async (data) => {
    if (isLoading || submittedRef.current) return;

    // Clear previous errors
    setConsentError("");

    // Validate consent (Gewinnspiel-Teilnahme - Pflicht)
    if (!consent) {
      setConsentError("Bitte akzeptiere die Teilnahmebedingungen.");
      return;
    }

    setIsLoading(true);
    try {
      submittedRef.current = true;

      const res = await callGiveawayAPI({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Teilnahme fehlgeschlagen");
      }

      setStep("done");
      submittedRef.current = false;
    } catch (error) {
      console.error("Giveaway error:", error);
      alert(error.message || "Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      submittedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen
  if (step === "done") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-green-50 to-red-50 px-4">
        {/* Weihnachtliche Schneeflocken Animation */}
        {!prefersReducedMotion && typeof window !== "undefined" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: window.innerWidth < 768 ? 10 : 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl md:text-4xl"
                initial={{ top: -50, left: `${Math.random() * 100}%` }}
                animate={{ top: "110vh", rotate: 360 }}
                transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
              >
                ❄️
              </motion.div>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg mx-auto relative z-10 px-4">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-5xl md:text-7xl mb-4 md:mb-6">🎄🎁</motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-black mb-4 md:mb-6 px-2">
            <span className="bg-gradient-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent">TEILNAHME BESTÄTIGT!</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 mb-4 md:mb-6 px-2">
            Deine Teilnahme wurde erfolgreich registriert! 🎫✨
          </p>
          <div className="bg-white/90 backdrop-blur-sm p-4 md:p-5 rounded-xl shadow-lg border-2 border-red-200 space-y-3">
            <p className="text-sm md:text-base text-gray-600">
              {newsletterOptIn
                ? "📧 Bitte bestätige deine Newsletter-Anmeldung in der E-Mail (Double-Opt-In)."
                : "✅ Deine Teilnahme wurde gespeichert!"}
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              🎅 Der Gewinner wird nach Ende des Teilnahmezeitraums (24.12.2025) per E-Mail benachrichtigt.
            </p>
            {newsletterOptIn && (
              <p className="text-xs md:text-sm text-gray-500">Falls keine E-Mail kommt: Spam-Ordner prüfen.</p>
            )}
          </div>

          <div className="mt-6 md:mt-8 bg-gradient-to-r from-red-50 to-green-50 border-2 border-red-300 rounded-xl p-3 md:p-4 shadow-lg">
            <p className="text-[10px] md:text-xs text-gray-700 leading-relaxed">
              🎄 <strong>Teilnahmezeitraum:</strong> 01.12.–24.12.2025 bis 23:59 MEZ · Teilnahme ab 18 Jahren, DE/AT/CH · Keine Kaufpflicht – kostenlose Teilnahme möglich ·
              Veranstalter: Venture One Group GmbH, Wuppertal.
              <a href="/teilnahmebedingungen" target="_blank" className="underline ml-1 text-red-700 font-semibold">Teilnahmebedingungen</a> ·
              Gewinne nicht übertragbar, keine Barauszahlung · Der Rechtsweg ist ausgeschlossen.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-green-50 to-red-50 overflow-hidden px-4 py-8">
      {/* Weihnachtliche Schneeflocken & Dekoration Animation */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {seeds.map((s, i) => (
            <motion.div key={i} className="absolute"
              animate={{ y: [-100, vh + 100], x: [0, s.xDrift], rotate: [0, 360] }}
              transition={{ duration: s.duration, repeat: Infinity, ease: "linear", delay: s.delay }}
              style={{ left: `${s.leftPct}%`, top: "-100px" }}>
              <div className="text-5xl opacity-80">
                {christmasImages[i % christmasImages.length]}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="container mx-auto text-center relative z-10 max-w-5xl">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-8">
          <div className="relative w-20 h-20 md:w-28 md:h-28">
            <Image src="/sweeetts.svg" alt="Sweets aus aller Welt – Logo" fill priority className="object-contain drop-shadow-lg"
                   sizes="(max-width: 768px) 80px, 112px" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight">
              <span className="bg-gradient-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent">🎄 WEIHNACHTS</span><br />
              <span className="bg-gradient-to-r from-green-600 via-red-600 to-green-600 bg-clip-text text-transparent">GEWINNSPIEL 🎁</span>
            </motion.h1>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-2 max-w-3xl mx-auto">
              <p className="text-lg md:text-xl text-gray-800 font-bold leading-relaxed">
                Mach mit bei unserem <span className="text-red-600">🎅 Weihnachts-Gewinnspiel ✨</span> und gewinne tolle Preise!
              </p>
              <div className="inline-block bg-gradient-to-r from-red-500 to-green-500 text-white px-6 py-2 rounded-full shadow-lg">
                <span className="font-bold text-base">🎄 Adventskalender-Gewinnspiel 2025 🎁</span>
              </div>
            </motion.div>
          </div>

          {/* FORM */}
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-2xl mx-auto">
            <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-center mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-4xl md:text-5xl mb-3"
                  >
                    🎅🎄
                  </motion.div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm px-2">Jetzt mitmachen!</h3>
                  <p className="text-sm md:text-base text-gray-700 drop-shadow-sm px-4">Fülle das Formular aus und nimm am Gewinnspiel teil</p>
                </div>

                <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                  {/* Vorname */}
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="text"
                        placeholder="Dein Vorname *"
                        {...contactForm.register("firstName", { required: "Vorname ist erforderlich", minLength: { value: 2, message: "Mindestens 2 Zeichen" } })}
                        className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 md:py-4 text-sm md:text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                      />
                    </div>
                    {contactForm.formState.errors.firstName && <p className="text-red-600 text-sm mt-2 text-left font-medium px-2">{contactForm.formState.errors.firstName.message}</p>}
                  </div>

                  {/* Nachname */}
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="text"
                        placeholder="Dein Nachname *"
                        {...contactForm.register("lastName", { required: "Nachname ist erforderlich", minLength: { value: 2, message: "Mindestens 2 Zeichen" } })}
                        className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 md:py-4 text-sm md:text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                      />
                    </div>
                    {contactForm.formState.errors.lastName && <p className="text-red-600 text-sm mt-2 text-left font-medium px-2">{contactForm.formState.errors.lastName.message}</p>}
                  </div>

                  {/* E-Mail */}
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="email"
                        placeholder="Deine E-Mail Adresse *"
                        {...contactForm.register("email", {
                          required: "E-Mail ist erforderlich",
                          pattern: { value: /\S+@\S+\.\S+/, message: "Bitte gib eine gültige E-Mail Adresse ein" }
                        })}
                        className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 md:py-4 text-sm md:text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                      />
                    </div>
                    {contactForm.formState.errors.email && <p className="text-red-600 text-sm mt-2 text-left font-medium px-2">{contactForm.formState.errors.email.message}</p>}
                  </div>

                  {/* Telefon */}
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="tel"
                        placeholder="Telefonnummer (optional)"
                        {...contactForm.register("phone")}
                        className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 md:py-4 text-sm md:text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-3 bg-white/20 p-3 md:p-4 rounded-xl">
                    <p className="text-xs md:text-sm font-semibold text-gray-800">📍 Lieferadresse (optional)</p>
                    <div className="relative">
                      <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="text"
                        placeholder="Straße und Hausnummer"
                        {...contactForm.register("street")}
                        className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 text-sm md:text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <input
                        type="text"
                        placeholder="PLZ"
                        {...contactForm.register("postalCode")}
                        className="w-full px-3 md:px-4 py-3 text-sm md:text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                      />
                      <input
                        type="text"
                        placeholder="Stadt"
                        {...contactForm.register("city")}
                        className="w-full px-3 md:px-4 py-3 text-sm md:text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                      />
                    </div>
                    <select
                      {...contactForm.register("country")}
                      defaultValue="DE"
                      className="w-full px-3 md:px-4 py-3 text-sm md:text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none"
                    >
                      <option value="DE">🇩🇪 Deutschland</option>
                      <option value="AT">🇦🇹 Österreich</option>
                      <option value="CH">🇨🇭 Schweiz</option>
                    </select>
                  </div>

                  {/* Gewinnspiel-Teilnahme Checkbox (PFLICHT) */}
                  <label className="flex items-start gap-2 md:gap-3 text-left bg-gradient-to-r from-red-50 to-green-50 border-2 border-red-400 rounded-xl p-3 md:p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (e.target.checked) setConsentError("");
                      }}
                      className="mt-1 h-4 w-4 md:h-5 md:w-5 text-red-600 border-red-400 rounded focus:ring-red-500 flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm text-gray-800">
                      <strong className="text-red-700">🎄 Ich akzeptiere die <a href="/teilnahmebedingungen" target="_blank" className="underline text-red-700">Teilnahmebedingungen</a> und die <a href="/datenschutz" target="_blank" className="underline text-red-700">Datenschutzerklärung</a>. *</strong>
                    </span>
                  </label>
                  {consentError && <p className="text-red-600 text-xs md:text-sm -mt-2 font-semibold px-2">{consentError}</p>}

                  {/* Newsletter Checkbox (OPTIONAL) */}
                  <label className="flex items-start gap-2 md:gap-3 text-left bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-3 md:p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
                    <input
                      type="checkbox"
                      checked={newsletterOptIn}
                      onChange={(e) => setNewsletterOptIn(e.target.checked)}
                      className="mt-1 h-4 w-4 md:h-5 md:w-5 text-green-600 border-green-400 rounded focus:ring-green-500 flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm text-gray-800 leading-relaxed">
                      <strong className="text-green-700">🎁 BONUS:</strong> Ja, ich möchte den Newsletter von <strong>Sweets aus aller Welt</strong> per E-Mail erhalten mit exklusiven Angeboten und News.
                      Hinweise zu Inhalten, Protokollierung, Versand über Mailchimp, statistischer Auswertung sowie Widerruf findest du in der{" "}
                      <a href="/datenschutz" target="_blank" className="underline text-green-700 font-semibold">Datenschutzerklärung</a>.
                      Die Einwilligung kann jederzeit über den Abmeldelink widerrufen werden.
                    </span>
                  </label>

                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    type="submit"
                    disabled={isLoading || !consent}
                    className="w-full bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white font-black py-4 md:py-5 px-4 md:px-6 rounded-xl shadow-2xl hover:shadow-green-500/50 transition-all disabled:opacity-70 flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg border-2 border-white"
                  >
                    {isLoading ? (
                      <><div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-3 border-white border-t-transparent" /> 🎅 Wird verarbeitet...</>
                    ) : (
                      <>
                        <span className="hidden sm:inline">🎄</span>
                        <span className="text-sm md:text-base lg:text-lg">Jetzt teilnehmen!</span>
                        <span className="hidden sm:inline">🎁</span>
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Legal links */}
                <div className="text-[10px] md:text-xs text-gray-700 mt-4 text-center drop-shadow-sm space-y-2">
                  <p className="text-[10px] md:text-xs leading-relaxed bg-white/50 p-2 md:p-3 rounded-lg">
                    <strong>Aktionszeitraum:</strong> 01.11.25 – 11.01.2026. Einlösung bis: 31.01.2026<br className="hidden sm:block" /><span className="sm:hidden"> </span>
                    <strong>Teilnahmezeitraum:</strong> 01.12.–24.12.2025 bis 23:59 MEZ · Teilnahme ab 18 Jahren, DE/AT/CH · Keine Kaufpflicht – kostenlose Teilnahme möglich ·
                    Veranstalter: Venture One Group GmbH, Wuppertal.
                    <a href="/teilnahmebedingungen" target="_blank" className="underline ml-1 text-red-700 font-semibold">Teilnahmebedingungen & Datenschutz</a> ·
                    Gewinne nicht übertragbar, keine Barauszahlung · Der Rechtsweg ist ausgeschlossen.
                  </p>
                  <p className="text-[10px] md:text-xs">
                    <a href="/impressum" target="_blank" className="underline hover:text-red-600">Impressum</a> ·{" "}
                    <a href="/datenschutz" target="_blank" className="underline hover:text-red-600">Datenschutzerklärung</a> ·{" "}
                    <a href="/agb" target="_blank" className="underline hover:text-red-600">AGB</a>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
