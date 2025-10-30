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

  const sweetImages = ["/test.svg", "/test.svg", "/test.svg"];

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
        offer: "Adventskalender 2024",
        utm_source: getUTMParameter("utm_source") || "direct",
        utm_medium: getUTMParameter("utm_medium") || "organic",
        utm_campaign: getUTMParameter("utm_campaign") || "rubbellos_2024",
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

  // Success Screen
  if (step === "done") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg mx-auto">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-7xl mb-6">🎉</motion.div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">TEILNAHME BESTÄTIGT!</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-6">Dein Code <strong>{ticketCode}</strong> wurde erfolgreich registriert! 🎫</p>
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg space-y-3">
            <p className="text-base text-gray-600">
              {newsletterOptIn
                ? "📧 Bitte bestätige deine Newsletter-Anmeldung in der E-Mail (Double-Opt-In)."
                : "✅ Deine Teilnahme wurde gespeichert!"}
            </p>
            <p className="text-sm text-gray-500">
              Der Gewinner wird nach Ende des Teilnahmezeitraums (24.12.2025) per E-Mail benachrichtigt.
            </p>
            {newsletterOptIn && (
              <p className="text-sm text-gray-500">Falls keine E-Mail kommt: Spam-Ordner prüfen.</p>
            )}
          </div>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Teilnahmezeitraum:</strong> 01.12.–24.12.2025 bis 23:59 MEZ · Teilnahme ab 18 Jahren, DE/AT/CH · Keine Kaufpflicht – kostenlose Teilnahme möglich ·
              Veranstalter: Venture One Group GmbH, Wuppertal.
              <a href="/teilnahmebedingungen" target="_blank" className="underline ml-1">Teilnahmebedingungen</a> ·
              Gewinne nicht übertragbar, keine Barauszahlung · Der Rechtsweg ist ausgeschlossen.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100 overflow-hidden px-4 py-8">
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          {seeds.map((s, i) => (
            <motion.div key={i} className="absolute"
              animate={{ y: [-100, vh + 100], x: [0, s.xDrift], rotate: [0, 360] }}
              transition={{ duration: s.duration, repeat: Infinity, ease: "linear", delay: s.delay }}
              style={{ left: `${s.leftPct}%`, top: "-100px" }}>
              <img src={sweetImages[i % sweetImages.length]} alt="Süßigkeit"
                   className="w-24 h-24 md:w-32 md:h-32 opacity-70 object-cover rounded-lg" loading="lazy"
                   onError={(e) => (e.target.style.display = "none")} />
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
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">GOLDEN TICKET</span><br />
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">GEWINNSPIEL 🎫</span>
            </motion.h1>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-2 max-w-3xl mx-auto">
              <p className="text-lg md:text-xl text-gray-800 font-bold leading-relaxed">
                Gib deinen 8-stelligen Code ein und <span className="text-amber-600">erfahre welche Gewinne hinter deinem Rubbellos stecken</span>
              </p>
            </motion.div>
          </div>

          {/* FORM */}
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-2xl mx-auto">
            <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30">

              {/* CODE STEP */}
              {step === "code" && (
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 drop-shadow-sm">🎫 Dein Gewinncode</h3>

                  <form onSubmit={handleCodeSubmit} className="space-y-4">
                    <div>
                      <div className="relative">
                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6" />
                        <input
                          type="text"
                          placeholder="8-stelliger Code (z.B. ABC12345)"
                          value={ticketCode}
                          onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                          maxLength={8}
                          className="w-full pl-14 pr-6 py-5 text-xl font-bold text-center text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none placeholder:text-gray-500 placeholder:font-normal tracking-widest"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Bitte gib den 8-stelligen Code von deinem Rubbellos ein</p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-3 text-base"
                    >
                      Code einlösen <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* CONTACT STEP */}
              {step === "contact" && (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">✨</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">Fast geschafft!</h3>
                    <p className="text-gray-700 drop-shadow-sm">Vervollständige deine Teilnahme mit deinen Kontaktdaten</p>
                    <div className="inline-block bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 mt-3">
                      <p className="text-sm font-mono font-bold text-amber-900">Code: {ticketCode}</p>
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
                          className="w-full pl-12 pr-6 py-4 text-base text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none placeholder:text-gray-600"
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
                          className="w-full pl-12 pr-6 py-4 text-base text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none placeholder:text-gray-600"
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
                          className="w-full pl-12 pr-6 py-4 text-base text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none placeholder:text-gray-600"
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
                          className="w-full pl-12 pr-6 py-4 text-base text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none placeholder:text-gray-600"
                        />
                      </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-3 bg-white/20 p-4 rounded-xl">
                      <p className="text-sm font-semibold text-gray-800">Lieferadresse (optional)</p>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Straße und Hausnummer"
                          {...contactForm.register("street")}
                          className="w-full pl-12 pr-6 py-3 text-base text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none placeholder:text-gray-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="PLZ"
                          {...contactForm.register("postalCode")}
                          className="w-full px-4 py-3 text-base text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none placeholder:text-gray-600"
                        />
                        <input
                          type="text"
                          placeholder="Stadt"
                          {...contactForm.register("city")}
                          className="w-full px-4 py-3 text-base text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none placeholder:text-gray-600"
                        />
                      </div>
                      <select
                        {...contactForm.register("country")}
                        className="w-full px-4 py-3 text-base text-gray-900 border-2 border-white/30 bg-white/40 rounded-xl focus:border-amber-500 focus:bg-white/60 focus:outline-none"
                      >
                        <option value="DE">Deutschland</option>
                        <option value="AT">Österreich</option>
                        <option value="CH">Schweiz</option>
                      </select>
                    </div>

                    {/* Gewinnspiel-Teilnahme Checkbox (PFLICHT) */}
                    <label className="flex items-start gap-3 text-left bg-amber-50/80 border-2 border-amber-300 rounded-xl p-4">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          if (e.target.checked) setConsentError("");
                        }}
                        className="mt-1 h-5 w-5"
                      />
                      <span className="text-sm text-gray-800">
                        <strong>Ich akzeptiere die <a href="/teilnahmebedingungen" target="_blank" className="underline text-amber-700">Teilnahmebedingungen</a> und die <a href="/datenschutz" target="_blank" className="underline text-amber-700">Datenschutzerklärung</a>. *</strong>
                      </span>
                    </label>
                    {consentError && <p className="text-red-600 text-sm -mt-2">{consentError}</p>}

                    {/* Newsletter Checkbox (OPTIONAL) */}
                    <label className="flex items-start gap-3 text-left bg-green-50/80 border-2 border-green-300 rounded-xl p-4">
                      <input
                        type="checkbox"
                        checked={newsletterOptIn}
                        onChange={(e) => {
                          setNewsletterOptIn(e.target.checked);
                          if (!e.target.checked) setNewsletterError("");
                        }}
                        className="mt-1 h-5 w-5"
                      />
                      <span className="text-sm text-gray-800">
                        Ja, ich möchte den Newsletter von <strong>Sweets aus aller Welt</strong> per E-Mail erhalten mit exklusiven Angeboten und News.
                        Hinweise zu Inhalten, Protokollierung, Versand über Mailchimp, statistischer Auswertung sowie Widerruf findest du in der{" "}
                        <a href="/datenschutz" target="_blank" className="underline text-green-700">Datenschutzerklärung</a>.
                        Die Einwilligung kann jederzeit über den Abmeldelink widerrufen werden.
                      </span>
                    </label>

                    <motion.button
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      type="submit"
                      disabled={isLoading || !consent}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-base"
                    >
                      {isLoading ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Wird verarbeitet...</>
                      ) : (
                        <>Jetzt am Gewinnspiel teilnehmen! <ChevronRight className="w-5 h-5" /></>
                      )}
                    </motion.button>
                  </form>

                  {/* Legal links */}
                  <div className="text-xs text-gray-700 mt-4 text-center drop-shadow-sm space-y-2">
                    <p className="text-xs leading-relaxed bg-white/50 p-3 rounded-lg">
                      <strong>Aktionszeitraum:</strong> 01.11.25 – 11.01.2026. Einlösung bis: 31.01.2026<br />
                      <strong>Teilnahmezeitraum:</strong> 01.12.–24.12.2025 bis 23:59 MEZ · Teilnahme ab 18 Jahren, DE/AT/CH · Keine Kaufpflicht – kostenlose Teilnahme möglich ·
                      Veranstalter: Venture One Group GmbH, Wuppertal.
                      <a href="/teilnahmebedingungen" target="_blank" className="underline ml-1">Teilnahmebedingungen & Datenschutz</a> ·
                      Gewinne nicht übertragbar, keine Barauszahlung · Der Rechtsweg ist ausgeschlossen.
                    </p>
                    <p>
                      <a href="/impressum" target="_blank" className="underline">Impressum</a> ·{" "}
                      <a href="/datenschutz" target="_blank" className="underline">Datenschutzerklärung</a> ·{" "}
                      <a href="/agb" target="_blank" className="underline">AGB</a>
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
