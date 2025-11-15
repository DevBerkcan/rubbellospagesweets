"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mail, User, MapPin, Phone, Ticket, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";

export default function GoldenTicketForm() {
  const [step, setStep] = useState("code");

  // States
  const [ticketCode, setTicketCode] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [newsletterError, setNewsletterError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    street: "", city: "", postalCode: "", country: "DE"
  });

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

  // API Call für Golden Ticket
  const callGoldenTicketAPI = async (data) => {
    return fetch("/api/golden-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        ticketCode,
        newsletterOptIn,
        source: "rubbellos",
        offer: "Adventskalender 2025",
        utm_source: getUTMParameter("utm_source") || "direct",
        utm_medium: getUTMParameter("utm_medium") || "organic",
        utm_campaign: getUTMParameter("utm_campaign") || "rubbellos_2025",
        consent: true,
        consentTs: new Date().toISOString(),
      }),
    });
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    const code = ticketCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{8}$/.test(code)) {
      alert("Bitte gib einen gültigen 8-stelligen Code ein (nur Buchstaben und Zahlen)");
      return;
    }

    setTicketCode(code);
    setStep("contact");
  };

  const onSubmitContact = async (data) => {
    if (isLoading || submittedRef.current) return;

    // Clear previous errors
    setConsentError("");
    setNewsletterError("");

    // Validate consent (Gewinnspiel-Teilnahme - Pflicht)
    if (!consent) {
      setConsentError("Bitte akzeptiere die Teilnahmebedingungen.");
      return;
    }

    setIsLoading(true);
    try {
      submittedRef.current = true;

      const res = await callGoldenTicketAPI({
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
      console.error("Golden Ticket error:", error);
      alert(error.message || "Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      submittedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen mit Background-Image und Modal
  if (step === "done") {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Mobile Hintergrundbild */}
        <div className="absolute inset-0 z-0 md:hidden">
          <Image
            src="/Rubbellos.png"
            alt="Hintergrund Mobile"
            fill
            priority
            className="object-cover"
            quality={100}
          />
          {/* Blur Overlay */}
          <div className="absolute inset-0 backdrop-blur-md bg-black/30" />
        </div>

        {/* Desktop Hintergrundbild */}
        <div className="absolute inset-0 z-0 hidden md:block">
          <Image
            src="/Rubbellos_desktop.png"
            alt="Hintergrund Desktop"
            fill
            priority
            className="object-cover"
            quality={100}
          />
          {/* Blur Overlay */}
          <div className="absolute inset-0 backdrop-blur-md bg-black/30" />
        </div>

        {/* Success Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-lg mx-auto"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border-2 border-white/50">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-center mb-4"
            >
              <div className="inline-block text-6xl md:text-7xl">🎄🎁</div>
            </motion.div>

            {/* Heading */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-center mb-4 bg-gradient-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent">
              TEILNAHME BESTÄTIGT!
            </h1>

            {/* Code Display */}
            <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl p-4 mb-4 border-2 border-red-200">
              <p className="text-sm text-gray-600 text-center mb-2">
                Dein Code wurde erfolgreich registriert:
              </p>
              <p className="text-2xl md:text-3xl font-bold text-center text-red-600 tracking-[0.3em]">
                {ticketCode}
              </p>
              <p className="text-xs text-center text-gray-500 mt-2">🎫✨</p>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-red-50 to-green-50 rounded-xl p-4 mb-4 space-y-3 border border-red-100">
              <p className="text-sm text-gray-700 text-center">
                {newsletterOptIn
                  ? "📧 Bitte bestätige deine Newsletter-Anmeldung in der E-Mail (Double-Opt-In)."
                  : "✅ Deine Teilnahme wurde gespeichert!"}
              </p>
              <p className="text-xs text-gray-600 text-center">
                🎅 Der Gewinner wird nach Ende des Teilnahmezeitraums (24.12.2025) per E-Mail benachrichtigt.
              </p>
              {newsletterOptIn && (
                <p className="text-xs text-gray-500 text-center">
                  💡 Falls keine E-Mail kommt: Spam-Ordner prüfen.
                </p>
              )}
            </div>

            {/* Shop Button */}
            <motion.a
              href="https://www.sweetsausallerwelt.de"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="block w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-full shadow-lg transition-all duration-200 text-center mb-4"
            >
              <span className="flex items-center justify-center gap-2">
                🛍️ Zum Shop
                <ChevronRight className="w-5 h-5" />
              </span>
            </motion.a>

            {/* Legal Text */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-[10px] md:text-xs text-gray-600 leading-relaxed text-center">
                🎄 <strong>Teilnahmezeitraum:</strong> 01.12.–24.12.2025 bis 23:59 MEZ · Teilnahme ab 18 Jahren, DE/AT/CH · Keine Kaufpflicht – kostenlose Teilnahme möglich · Veranstalter: Venture One Group GmbH, Wuppertal.{" "}
                <a
                  href="/teilnahmebedingungen"
                  target="_blank"
                  className="underline text-red-700 font-semibold hover:text-red-800"
                >
                  Teilnahmebedingungen
                </a>{" "}
                · Gewinne nicht übertragbar, keine Barauszahlung · Der Rechtsweg ist ausgeschlossen.
              </p>
            </div>
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
              <span className="bg-gradient-to-r from-green-600 via-red-600 to-green-600 bg-clip-text text-transparent">RUBBELLOS 🎁</span>
            </motion.h1>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-2 max-w-3xl mx-auto">
              <p className="text-lg md:text-xl text-gray-800 font-bold leading-relaxed">
                Gib deinen 8-stelligen Code ein und <span className="text-red-600">🎅 erfahre welche Gewinne hinter deinem Rubbellos stecken ✨</span>
              </p>
              <div className="inline-block bg-gradient-to-r from-red-500 to-green-500 text-white px-6 py-2 rounded-full shadow-lg">
                <span className="font-bold text-base">🎄 Adventskalender-Gewinnspiel 2025 🎁</span>
              </div>
            </motion.div>
          </div>

          {/* FORM */}
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-2xl mx-auto">
            <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30">

              {/* CODE STEP */}
              {step === "code" && (
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-5xl md:text-6xl mb-4"
                    >
                      🎫
                    </motion.div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm px-2">
                      🎄 Rubbellos einlösen
                    </h3>
                    <p className="text-xs md:text-sm text-gray-700 px-4">Kratze die silberne Fläche frei und gib den Code ein</p>
                  </div>

                  <form onSubmit={handleCodeSubmit} className="space-y-4">
                    <div>
                      {/* Rubbellos-Style Code-Eingabe */}
                      <div className="relative bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 p-4 md:p-6 rounded-2xl shadow-2xl border-2 md:border-4 border-gray-400">
                        <div className="absolute top-1 md:top-2 left-1 md:left-2 text-[8px] md:text-xs font-bold text-gray-600">GOLDEN TICKET</div>
                        <div className="absolute top-1 md:top-2 right-1 md:right-2 text-[8px] md:text-xs font-bold text-gray-600">★ XMAS 2025</div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border-2 border-dashed border-red-400 mt-3 md:mt-0">
                          <Ticket className="mx-auto text-red-600 w-6 h-6 md:w-8 md:h-8 mb-2" />
                          <input
                            type="text"
                            placeholder="????????"
                            value={ticketCode}
                            onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                            maxLength={8}
                            className="w-full px-2 md:px-4 py-3 md:py-4 text-xl md:text-2xl lg:text-3xl font-black text-center text-red-600 bg-gradient-to-r from-yellow-50 to-red-50 border-2 md:border-4 border-red-500 rounded-xl focus:border-green-500 focus:ring-2 md:focus:ring-4 focus:ring-green-300 focus:outline-none placeholder:text-gray-400 placeholder:font-bold tracking-[0.3em] md:tracking-[0.5em] shadow-inner"
                          />
                          <p className="text-[10px] md:text-xs text-gray-600 mt-2 font-semibold px-2">8-stelliger Code (Groß-/Kleinschreibung egal)</p>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white font-black py-4 md:py-5 px-4 md:px-6 rounded-xl shadow-2xl hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg border-2 border-white"
                    >
                      <span className="hidden sm:inline">🎁</span> Code jetzt einlösen! <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>

                    <p className="text-[10px] md:text-xs text-center text-gray-600 bg-white/50 p-2 md:p-3 rounded-lg leading-relaxed">
                      🎅 Teilnahme vom 01.12. - 24.12.2025 • Kostenlos & ohne Kaufpflicht
                    </p>
                  </form>
                </motion.div>
              )}

              {/* CONTACT STEP */}
              {step === "contact" && (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-4xl md:text-5xl mb-3"
                    >
                      🎅🎄
                    </motion.div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm px-2">Fast geschafft!</h3>
                    <p className="text-sm md:text-base text-gray-700 drop-shadow-sm px-4">Vervollständige deine Teilnahme mit deinen Kontaktdaten</p>
                    <div className="inline-block bg-gradient-to-r from-red-100 to-green-100 border-2 border-red-400 rounded-lg px-4 md:px-6 py-2 md:py-3 mt-3 shadow-lg">
                      <p className="text-xs md:text-sm font-mono font-black text-red-700">🎫 Code: {ticketCode}</p>
                    </div>
                  </div>

                  <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                    {/* Vorname */}
                    <div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Dein Vorname *"
                          {...contactForm.register("firstName", { required: "Vorname ist erforderlich", minLength: { value: 2, message: "Mindestens 2 Zeichen" } })}
                          className="w-full pl-12 pr-6 py-4 text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                        />
                      </div>
                      {contactForm.formState.errors.firstName && <p className="text-red-600 text-sm mt-2 text-left font-medium">{contactForm.formState.errors.firstName.message}</p>}
                    </div>

                    {/* Nachname */}
                    <div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Dein Nachname *"
                          {...contactForm.register("lastName", { required: "Nachname ist erforderlich", minLength: { value: 2, message: "Mindestens 2 Zeichen" } })}
                          className="w-full pl-12 pr-6 py-4 text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                        />
                      </div>
                      {contactForm.formState.errors.lastName && <p className="text-red-600 text-sm mt-2 text-left font-medium">{contactForm.formState.errors.lastName.message}</p>}
                    </div>

                    {/* E-Mail */}
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="email"
                          placeholder="Deine E-Mail Adresse *"
                          {...contactForm.register("email", {
                            required: "E-Mail ist erforderlich",
                            pattern: { value: /\S+@\S+\.\S+/, message: "Bitte gib eine gültige E-Mail Adresse ein" }
                          })}
                          className="w-full pl-12 pr-6 py-4 text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
                        />
                      </div>
                      {contactForm.formState.errors.email && <p className="text-red-600 text-sm mt-2 text-left font-medium">{contactForm.formState.errors.email.message}</p>}
                    </div>

                    {/* Telefon */}
                    <div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="tel"
                          placeholder="Telefonnummer (optional)"
                          {...contactForm.register("phone")}
                          className="w-full pl-12 pr-6 py-4 text-base text-gray-900 border-2 border-red-300 bg-white/60 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-300 focus:bg-white focus:outline-none placeholder:text-gray-600"
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
                        onChange={(e) => {
                          setNewsletterOptIn(e.target.checked);
                          if (!e.target.checked) setNewsletterError("");
                        }}
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
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
