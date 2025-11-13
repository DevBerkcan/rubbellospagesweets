"use client";

import { motion } from "framer-motion";
import { Mail, User, MapPin, Phone, ChevronRight, ChevronDown, Gift } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";

export default function ChristmasGiveawayForm() {
  const [step, setStep] = useState("form");
  const [showAddress, setShowAddress] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const submittedRef = useRef(false);

  const contactForm = useForm({ mode: "onSubmit", reValidateMode: "onBlur" });

  const getUTMParameter = (param) => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(param);
  };

  // API Call für Golden Ticket MIT Code
  const callGoldenTicketAPI = async (data) => {
    return fetch("/api/golden-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        source: "rubbellos",
        offer: "Adventskalender 2025",
        utm_source: getUTMParameter("utm_source") || "direct",
        utm_medium: getUTMParameter("utm_medium") || "organic",
        utm_campaign: getUTMParameter("utm_campaign") || "rubbellos_2025",
        consent: true,
        consentTs: new Date().toISOString(),
        newsletterOptIn: newsletterOptIn
      }),
    });
  };

  const onSubmitContact = async (data) => {
    if (isLoading || submittedRef.current) return;

    // Clear previous errors
    setConsentError("");

    // Validate consent
    if (!consent) {
      setConsentError("Bitte akzeptiere die Teilnahmebedingungen.");
      return;
    }

    // Validate ticket code
    if (!data.ticketCode || !/^[A-Z0-9]{8}$/.test(data.ticketCode)) {
      contactForm.setError("ticketCode", {
        type: "manual",
        message: "Bitte gib einen gültigen 8-stelligen Code ein"
      });
      return;
    }

    setIsLoading(true);
    try {
      submittedRef.current = true;

      const res = await callGoldenTicketAPI({
        ticketCode: data.ticketCode.toUpperCase(),
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
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg mx-auto relative z-10 px-4">
          <h1 className="text-2xl font-bold mb-4">TEILNAHME BESTÄTIGT!</h1>
          <p className="text-gray-700 mb-4">
            Deine Teilnahme wurde erfolgreich registriert!
          </p>
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
            <p className="text-sm text-gray-600">
              {newsletterOptIn
                ? "Bitte bestätige deine Newsletter-Anmeldung in der E-Mail (Double-Opt-In)."
                : "Deine Teilnahme wurde gespeichert!"}
            </p>
            <p className="text-xs text-gray-500">
              Der Gewinner wird nach Ende des Teilnahmezeitraums (24.12.2025) per E-Mail benachrichtigt.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Hintergrundbild */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Rubbellos.png"
          alt="Hintergrund"
          fill
          priority
          className="object-cover"
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      </div>

      <div className="container mx-auto text-center relative z-10 max-w-2xl px-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <div className="relative w-32 h-20">
            <Image
              src="/sweeetts.svg"
              alt="Sweets aus aller Welt – Logo"
              fill
              priority
              className="object-contain drop-shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Großer RUBBELLOS Titel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-2xl mb-3 tracking-wider">
            RUBBEL<br />LOS
          </h1>
          <p className="text-xl md:text-2xl font-bold text-white drop-shadow-lg tracking-widest">
            GEWINNSPIEL
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}>
          <div className="bg-white/10 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/30">
            <div className="text-center mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg">Jetzt mitmachen!</h3>
              <p className="text-sm text-white/90 drop-shadow">Gib deinen Code ein und nimm am Gewinnspiel teil</p>
            </div>

            <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
              {/* CODE Eingabe - NEU */}
              <div>
                <div className="relative">
                  <Gift className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="DEIN 8-STELLIGER CODE *"
                    {...contactForm.register("ticketCode", {
                      required: "Code ist erforderlich",
                      pattern: {
                        value: /^[A-Z0-9]{8}$/,
                        message: "Bitte gib einen gültigen 8-stelligen Code ein"
                      }
                    })}
                    className="w-full pl-12 pr-4 py-4 text-base font-bold text-center text-gray-900 bg-yellow-50 border-2 border-yellow-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder:text-yellow-700/70 uppercase tracking-widest shadow-lg"
                    style={{ letterSpacing: '2px' }}
                  />
                </div>
                {contactForm.formState.errors.ticketCode && (
                  <p className="text-red-300 text-sm mt-2 font-medium drop-shadow text-center">
                    {contactForm.formState.errors.ticketCode.message}
                  </p>
                )}
              </div>

              {/* Vorname und Nachname nebeneinander */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Vorname *"
                    {...contactForm.register("firstName", { required: "Vorname ist erforderlich", minLength: { value: 2, message: "Mindestens 2 Zeichen" } })}
                    className="w-full px-4 py-3 text-sm text-gray-900 bg-white/90 backdrop-blur-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder:text-gray-500 shadow-lg"
                  />
                  {contactForm.formState.errors.firstName && <p className="text-red-300 text-xs mt-1 text-left drop-shadow">{contactForm.formState.errors.firstName.message}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Nachname *"
                    {...contactForm.register("lastName", { required: "Nachname ist erforderlich", minLength: { value: 2, message: "Mindestens 2 Zeichen" } })}
                    className="w-full px-4 py-3 text-sm text-gray-900 bg-white/90 backdrop-blur-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder:text-gray-500 shadow-lg"
                  />
                  {contactForm.formState.errors.lastName && <p className="text-red-300 text-xs mt-1 text-left drop-shadow">{contactForm.formState.errors.lastName.message}</p>}
                </div>
              </div>

              {/* E-Mail und Telefon nebeneinander */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="email"
                    placeholder="E-Mail *"
                    {...contactForm.register("email", {
                      required: "E-Mail ist erforderlich",
                      pattern: { value: /\S+@\S+\.\S+/, message: "Bitte gib eine gültige E-Mail Adresse ein" }
                    })}
                    className="w-full px-4 py-3 text-sm text-gray-900 bg-white/90 backdrop-blur-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder:text-gray-500 shadow-lg"
                  />
                  {contactForm.formState.errors.email && <p className="text-red-300 text-xs mt-1 text-left drop-shadow">{contactForm.formState.errors.email.message}</p>}
                </div>

                <div>
                  <input
                    type="tel"
                    placeholder="Telefon (optional)"
                    {...contactForm.register("phone")}
                    className="w-full px-4 py-3 text-sm text-gray-900 bg-white/90 backdrop-blur-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder:text-gray-500 shadow-lg"
                  />
                </div>
              </div>

              {/* Adresse - Collapsible */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAddress(!showAddress)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="text-gray-600 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-800">Lieferadresse (optional)</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform ${showAddress ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAddress && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3 bg-white/50">
                    <div>
                      <input
                        type="text"
                        placeholder="Straße und Hausnummer"
                        {...contactForm.register("street")}
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder:text-gray-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="PLZ"
                        {...contactForm.register("postalCode")}
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder:text-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Stadt"
                        {...contactForm.register("city")}
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder:text-gray-500"
                      />
                    </div>
                    <select
                      {...contactForm.register("country")}
                      defaultValue="DE"
                      className="w-full px-4 py-3 text-sm text-gray-900 bg-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    >
                      <option value="DE">🇩🇪 Deutschland</option>
                      <option value="AT">🇦🇹 Österreich</option>
                      <option value="CH">🇨🇭 Schweiz</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Gewinnspiel-Teilnahme Checkbox (PFLICHT) */}
              <label className="flex items-start gap-3 text-left cursor-pointer bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setConsentError("");
                  }}
                  className="mt-0.5 h-5 w-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <span className="text-xs text-gray-800 leading-relaxed">
                  Ich akzeptiere die <a href="/teilnahmebedingungen" target="_blank" className="underline text-gray-900 font-semibold hover:text-yellow-600">Teilnahmebedingungen</a> und die <a href="/datenschutz" target="_blank" className="underline text-gray-900 font-semibold hover:text-yellow-600">Datenschutzerklärung</a>. *
                </span>
              </label>
              {consentError && <p className="text-red-300 text-xs -mt-1 font-medium drop-shadow">{consentError}</p>}

              {/* Newsletter Checkbox (OPTIONAL) */}
              <label className="flex items-start gap-3 text-left cursor-pointer bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                  className="mt-0.5 h-5 w-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <span className="text-xs text-gray-800 leading-relaxed">
                  <span className="font-bold">🎁 BONUS:</span> Ja, ich möchte den Newsletter von Sweets aus aller Welt per E-Mail erhalten mit exklusiven Angeboten und News. Hinweise zu Inhalten, Protokollierung, Versand über Mailchimp, statistischer Auswertung sowie Widerruf findest du in der <a href="/datenschutz" target="_blank" className="underline text-gray-900 font-semibold hover:text-yellow-600">Datenschutzerklärung</a>. Die Einwilligung kann jederzeit über den Abmeldelink widerrufen werden.
                </span>
              </label>

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                type="submit"
                disabled={isLoading || !consent}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-gray-900 font-black py-4 px-6 rounded-xl hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-2xl border-2 border-yellow-300"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-3 border-gray-900 border-t-transparent" />
                    <span>Wird verarbeitet...</span>
                  </>
                ) : (
                  <>
                    <span>Jetzt Einlösen</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="text-xs text-white/70 mt-6 text-center space-y-2">
              <p className="text-xs leading-relaxed drop-shadow">
                <a href="/teilnahmebedingungen" target="_blank" className="underline hover:text-white">Teilnahmebedingungen</a> ·{" "}
                <a href="/datenschutz" target="_blank" className="underline hover:text-white">Datenschutz</a> ·{" "}
                <a href="/impressum" target="_blank" className="underline hover:text-white">Impressum</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}