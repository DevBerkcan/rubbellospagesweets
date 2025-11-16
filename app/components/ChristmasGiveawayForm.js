"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";

export default function ChristmasGiveawayForm() {
  const [step, setStep] = useState("form");
  const [showAddress, setShowAddress] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const submittedRef = useRef(false);

  const contactForm = useForm({ mode: "onSubmit", reValidateMode: "onBlur" });

  const getUTMParameter = (param) => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(param);
  };

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
        newsletterOptIn: newsletterOptIn,
      }),
    });
  };

  const onSubmitContact = async (data) => {
    if (isLoading || submittedRef.current) return;

    setConsentError("");

    if (!consent) {
      setConsentError("Bitte akzeptiere die Teilnahmebedingungen.");
      return;
    }

    if (!data.ticketCode || !/^[A-Z0-9]{5}$/.test(data.ticketCode)) {
      contactForm.setError("ticketCode", {
        type: "manual",
        message: "Bitte gib einen gültigen 5-stelligen Code ein",
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

      setTicketCode(data.ticketCode.toUpperCase());
      setStep("done");
      submittedRef.current = false;
    } catch (error) {
      console.error("Golden Ticket error:", error);

      // Bessere Fehlermeldungen für spezifische Fehler
      let errorMessage = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";

      if (error.message.includes("bereits eingelöst") || error.message.includes("CODE_ALREADY_USED")) {
        errorMessage = "❌ Dieser Code wurde bereits eingelöst. Bitte verwende einen anderen Code.";
      } else if (error.message.includes("bereits teilgenommen") || error.message.includes("EMAIL_ALREADY_PARTICIPATED")) {
        errorMessage = "❌ Du hast bereits mit dieser E-Mail Adresse teilgenommen. Pro E-Mail ist nur eine Teilnahme möglich.";
      } else if (error.message.includes("gültigen 5-stelligen Code")) {
        errorMessage = "❌ Bitte gib einen gültigen 5-stelligen Code ein (nur Buchstaben und Zahlen).";
      } else {
        errorMessage = error.message || errorMessage;
      }

      alert(errorMessage);
      submittedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // SUCCESS SCREEN mit Background-Image und Modal
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
              VIELEN DANK FÜR DEINE TEILNAHME!
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

            {/* Hauptnachricht - LOS TOPF */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 mb-4 border-2 border-amber-300 shadow-lg">
              <div className="text-center mb-3">
                <p className="text-2xl md:text-3xl font-bold mb-2">🎁🎉</p>
                <h2 className="text-lg md:text-xl font-black text-amber-900 mb-2">
                  Du bist jetzt im Täglichen LOS TOPF!
                </h2>
                <p className="text-sm md:text-base text-gray-700 font-semibold">
                  Wir verlosen jeden Monat Sweetsboxen!
                </p>
              </div>
            </div>

            {/* Info Boxen */}
            <div className="space-y-3 mb-4">
              {/* Newsletter Opt-in Info */}
              {newsletterOptIn && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-gray-700 text-center font-medium">
                    📧 Bitte bestätige deine E-Mail für den Newsletter-Zugang
                  </p>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    💡 Falls keine E-Mail kommt: Spam-Ordner prüfen
                  </p>
                </div>
              )}

              {/* Gewinner Benachrichtigung */}
              <div className="bg-gradient-to-br from-red-50 to-green-50 rounded-xl p-4 border border-red-200">
                <p className="text-sm text-gray-700 text-center">
                  🎅 Wir melden uns bei dir, wenn du gewonnen hast!
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Gewinner werden per E-Mail benachrichtigt
                </p>
              </div>
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

  // FORM (responsive mit höherer Position auf Mobile)
  return (
    <div className="relative min-h-screen flex items-end justify-center px-4 pb-6 pt-32 overflow-hidden md:items-end md:pb-16 md:pt-0">
      {/* Mobile Hintergrundbild */}
      <div className="absolute inset-0 z-0 md:hidden">
        <Image
          src="/Rubbellos-mobile.png"
          alt="Hintergrund Mobile"
          fill
          priority
          className="object-cover"
          quality={100}
        />
      </div>

      {/* Desktop Hintergrundbild */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <Image
          src="/Rubbellos-desktop.png"
          alt="Hintergrund Desktop"
          fill
          priority
          className="object-cover"
          quality={100}
        />
      </div>

      <div className="container mx-auto relative z-10 max-w-sm md:max-w-md space-y-4">
      

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full"
        >
          <form
            onSubmit={contactForm.handleSubmit(onSubmitContact)}
            className="space-y-3 md:space-y-4 md:bg-black/20 md:backdrop-blur-sm md:p-6 md:rounded-2xl md:border md:border-white/20"
          >
            {/* CODE */}
            <div className="w-full">
              {/* Überschrift nur auf Desktop */}
              <h2 className="hidden md:block text-white text-center text-lg font-semibold mb-3 drop-shadow-lg">
                Gib hier deinen Code ein
              </h2>
              <div className={`bg-gradient-to-r rounded-[32px] p-[2px] shadow-xl md:rounded-3xl ${
                contactForm.formState.errors.ticketCode
                  ? 'from-red-500 via-red-400 to-red-600'
                  : 'from-sky-500 via-cyan-400 to-blue-600'
              }`}>
                <div className="bg-sky-900/40 rounded-[30px] px-5 py-3 flex items-center justify-center md:px-6 md:py-4">
                  <input
                    type="text"
                    placeholder="ABCDE"
                    {...contactForm.register("ticketCode", {
                      required: "Code ist erforderlich",
                      pattern: {
                        value: /^[A-Z0-9]{5}$/,
                        message:
                          "Bitte gib einen gültigen 5-stelligen Code ein",
                      },
                    })}
                    maxLength={5}
                    className="w-full bg-transparent border-none outline-none text-center text-lg tracking-[0.4em] text-white font-semibold placeholder:text-white/60 uppercase md:text-xl"
                    style={{ letterSpacing: "0.4em" }}
                  />
                </div>
              </div>
              {contactForm.formState.errors.ticketCode && (
                <p className="text-red-200 bg-red-900/50 rounded-lg px-3 py-1.5 text-[11px] mt-2 text-center font-medium md:text-sm backdrop-blur-sm border border-red-400/30">
                  ⚠️ {String(contactForm.formState.errors.ticketCode.message)}
                </p>
              )}
            </div>

            {/* Vorname / Nachname */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Max"
                  {...contactForm.register("firstName", {
                    required: "Vorname ist erforderlich",
                    minLength: { value: 2, message: "Mindestens 2 Zeichen" },
                  })}
                  className={`w-full px-4 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md placeholder:text-gray-500 focus:outline-none focus:ring-2 md:px-5 md:py-3 md:text-sm ${
                    contactForm.formState.errors.firstName
                      ? 'border-2 border-red-500 focus:ring-red-400'
                      : 'border border-white/40 focus:ring-amber-400'
                  }`}
                />
                {contactForm.formState.errors.firstName && (
                  <p className="text-red-200 bg-red-900/50 rounded-lg px-2 py-1 text-[10px] mt-1 text-left md:text-xs backdrop-blur-sm border border-red-400/30">
                    ⚠️ {String(contactForm.formState.errors.firstName.message)}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Mustermann"
                  {...contactForm.register("lastName", {
                    required: "Nachname ist erforderlich",
                    minLength: { value: 2, message: "Mindestens 2 Zeichen" },
                  })}
                  className={`w-full px-4 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md placeholder:text-gray-500 focus:outline-none focus:ring-2 md:px-5 md:py-3 md:text-sm ${
                    contactForm.formState.errors.lastName
                      ? 'border-2 border-red-500 focus:ring-red-400'
                      : 'border border-white/40 focus:ring-amber-400'
                  }`}
                />
                {contactForm.formState.errors.lastName && (
                  <p className="text-red-200 bg-red-900/50 rounded-lg px-2 py-1 text-[10px] mt-1 text-left md:text-xs backdrop-blur-sm border border-red-400/30">
                    ⚠️ {String(contactForm.formState.errors.lastName.message)}
                  </p>
                )}
              </div>
            </div>

            {/* E-Mail / Telefon */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div>
                <input
                  type="email"
                  placeholder="max@sweetsausallerwelt.de"
                  {...contactForm.register("email", {
                    required: "E-Mail ist erforderlich",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message:
                        "Bitte gib eine gültige E-Mail Adresse ein",
                    },
                  })}
                  className={`w-full px-4 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md placeholder:text-gray-500 focus:outline-none focus:ring-2 md:px-5 md:py-3 md:text-sm ${
                    contactForm.formState.errors.email
                      ? 'border-2 border-red-500 focus:ring-red-400'
                      : 'border border-white/40 focus:ring-amber-400'
                  }`}
                />
                {contactForm.formState.errors.email && (
                  <p className="text-red-200 bg-red-900/50 rounded-lg px-2 py-1 text-[10px] mt-1 text-left md:text-xs backdrop-blur-sm border border-red-400/30">
                    ⚠️ {String(contactForm.formState.errors.email.message)}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="+49 151 23456789"
                  {...contactForm.register("phone", {
                    pattern: {
                      value: /^[\d\s\+\-\(\)]+$/,
                      message: "Nur Zahlen und +()-",
                    },
                  })}
                  className={`w-full px-4 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md placeholder:text-gray-500 focus:outline-none focus:ring-2 md:px-5 md:py-3 md:text-sm ${
                    contactForm.formState.errors.phone
                      ? 'border-2 border-red-500 focus:ring-red-400'
                      : 'border border-white/40 focus:ring-amber-400'
                  }`}
                />
                {contactForm.formState.errors.phone && (
                  <p className="text-red-200 bg-red-900/50 rounded-lg px-2 py-1 text-[10px] mt-1 text-left md:text-xs backdrop-blur-sm border border-red-400/30">
                    ⚠️ {String(contactForm.formState.errors.phone.message)}
                  </p>
                )}
              </div>
            </div>

            {/* Lieferadresse */}
            <div className="bg-black/20 rounded-xl overflow-hidden text-white text-xs md:text-sm md:bg-black/30">
              <button
                type="button"
                onClick={() => setShowAddress((s) => !s)}
                className="w-full flex items-center justify-between px-3 py-2 text-left md:px-4 md:py-3"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={`w-3 h-3 transition-transform md:w-4 md:h-4 ${
                      showAddress ? "rotate-90" : ""
                    }`}
                  />
                  <span>Lieferadresse (optional)</span>
                </div>
              </button>

              {showAddress && (
                <div className="px-3 pb-2 pt-1 space-y-2 bg-black/30 md:px-4 md:pb-3 md:pt-2 md:space-y-3">
                  <input
                    type="text"
                    placeholder="Straße und Hausnummer"
                    {...contactForm.register("street")}
                    className="w-full px-3 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md border border-white/40 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-4 md:py-3 md:text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <input
                      type="text"
                      placeholder="PLZ"
                      {...contactForm.register("postalCode")}
                      className="w-full px-3 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md border border-white/40 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-4 md:py-3 md:text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Stadt"
                      {...contactForm.register("city")}
                      className="w-full px-3 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md border border-white/40 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-4 md:py-3 md:text-sm"
                    />
                  </div>
                  <select
                    {...contactForm.register("country")}
                    defaultValue="DE"
                    className="w-full px-3 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md border border-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-4 md:py-3 md:text-sm"
                  >
                    <option value="DE">🇩🇪 Deutschland</option>
                    <option value="AT">🇦🇹 Österreich</option>
                    <option value="CH">🇨🇭 Schweiz</option>
                  </select>
                </div>
              )}
            </div>

            {/* Pflicht-Checkbox */}
            <label className="flex items-start gap-2 text-left cursor-pointer text-white text-[10px] leading-tight md:text-xs md:leading-relaxed">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (e.target.checked) setConsentError("");
                }}
                className="mt-0.5 h-3 w-3 text-amber-400 bg-transparent border-white/50 rounded focus:ring-amber-400 focus:ring-1 md:h-4 md:w-4 md:mt-0"
              />
              <span>
                Ich akzeptiere die{" "}
                <a
                  href="/teilnahmebedingungen"
                  target="_blank"
                  className="underline"
                >
                  Teilnahmebedingungen
                </a>{" "}
                und die{" "}
                <a
                  href="/datenschutz"
                  target="_blank"
                  className="underline"
                >
                  Datenschutzerklärung
                </a>
                . *
              </span>
            </label>
            {consentError && (
              <p className="text-red-200 bg-red-900/50 rounded-lg px-3 py-1.5 text-[10px] -mt-1 font-medium md:text-xs backdrop-blur-sm border border-red-400/30">
                ⚠️ {consentError}
              </p>
            )}

            {/* Newsletter */}
            <label className="flex items-start gap-2 text-left cursor-pointer text-white text-[10px] leading-tight md:text-xs md:leading-relaxed">
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(e) => setNewsletterOptIn(e.target.checked)}
                className="mt-0.5 h-3 w-3 text-amber-400 bg-transparent border-white/50 rounded focus:ring-amber-400 focus:ring-1 md:h-4 md:w-4 md:mt-0"
              />
              <span>
                <span className="font-bold text-amber-300">🎁 BONUS:</span> Ja, ich möchte den Newsletter von Sweets aus aller Welt per E-Mail erhalten mit exklusiven Angeboten und News. Hinweise zu Inhalten, Protokollierung, Versand über Mailchimp, statistischer Auswertung sowie Widerruf findest du in der{" "}
                <a
                  href="/datenschutz"
                  target="_blank"
                  className="underline hover:text-amber-200"
                >
                  Datenschutzerklärung
                </a>
                . Die Einwilligung kann jederzeit über den Abmeldelink widerrufen werden.
              </span>
            </label>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              type="submit"
              disabled={isLoading || !consent}
              className="w-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-gray-900 font-semibold py-2.5 rounded-full shadow-lg hover:from-amber-400 hover:to-orange-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm border border-amber-200 md:py-3 md:text-base"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-gray-900 border-t-transparent md:h-4 md:w-4" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  Jetzt Einlösen
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </>
              )}
            </motion.button>

            {/* Footer-Links */}
            <div className="text-[9px] text-gray-200 text-center space-y-0.5 md:text-xs">
              <p>
                <a
                  href="/teilnahmebedingungen"
                  target="_blank"
                  className="underline hover:text-white"
                >
                  Teilnahmebedingungen
                </a>{" "}
                ·{" "}
                <a
                  href="/datenschutz"
                  target="_blank"
                  className="underline hover:text-white"
                >
                  Datenschutz
                </a>{" "}
                ·{" "}
                <a
                  href="/impressum"
                  target="_blank"
                  className="underline hover:text-white"
                >
                  Impressum
                </a>
              </p>
            </div>
          </form>
        </motion.div>
        {/* WIE FUNKTIONIERT'S - Aufklappbare Anleitung */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 overflow-hidden md:bg-white/20">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full px-3 md:px-5 py-2.5 md:py-3 flex items-center justify-between text-left hover:bg-white/20 transition-colors"
            >
              <div className="flex-1 pr-2">
                <h3 className="text-sm md:text-base font-bold text-white mb-0.5 drop-shadow-md">
                  🎉 So funktioniert dein Rubbel-Los
                </h3>
                <p className="text-[10px] md:text-xs text-white/90 drop-shadow-sm">
                  Rubbel die gekennzeichnete Fläche frei...
                </p>
              </div>
              <ChevronRight
                className={`w-4 h-4 md:w-5 md:h-5 text-white drop-shadow-md transition-transform flex-shrink-0 ${
                  showInstructions ? 'rotate-90' : ''
                }`}
              />
            </button>

            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="px-3 md:px-5 pb-3 md:pb-4 bg-white/10 backdrop-blur-sm"
              >
                <div className="space-y-3 text-left">
                  {/* Schritt 1 */}
                  <div className="flex gap-2 md:gap-3">
                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-xs md:text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-xs md:text-sm mb-0.5 drop-shadow-md">Feld freirubbeln</h4>
                      <p className="text-[10px] md:text-xs text-white/90 leading-relaxed drop-shadow-sm">
                        Rubbel die gekennzeichnete Fläche auf deinem Los vorsichtig frei und schau dir die Emojis an.
                      </p>
                    </div>
                  </div>

                  {/* Schritt 2 */}
                  <div className="flex gap-2 md:gap-3">
                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center font-bold text-xs md:text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-xs md:text-sm mb-0.5 drop-shadow-md">Auf 3 gleiche Emojis achten</h4>
                      <p className="text-[10px] md:text-xs text-white/90 leading-relaxed drop-shadow-sm">
                        Hast du 3 gleiche Emojis in der Gewinnzone aufgedeckt?
                        <span className="font-semibold text-green-300"> 👉 Dann hast du einen Gewinn!</span>
                      </p>
                    </div>
                  </div>

                  {/* Schritt 3 */}
                  <div className="flex gap-2 md:gap-3">
                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-xs md:text-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-xs md:text-sm mb-0.5 drop-shadow-md">Gewinn prüfen & einlösen</h4>
                      <p className="text-[10px] md:text-xs text-white/90 leading-relaxed drop-shadow-sm">
                        Auf deinem Los steht, welcher Gewinn zu deiner Emoji-Kombination gehört und wie du ihn einlöst.
                      </p>
                    </div>
                  </div>

                  {/* Schritt 4 */}
                  <div className="flex gap-2 md:gap-3">
                    <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center font-bold text-xs md:text-sm">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-xs md:text-sm mb-0.5 drop-shadow-md">Süßigkeiten sichern 😋</h4>
                      <p className="text-[10px] md:text-xs text-white/90 leading-relaxed drop-shadow-sm">
                        Wir prüfen deinen Gewinn und melden uns bei dir!
                      </p>
                    </div>
                  </div>

                  {/* Legal Notice */}
                  <div className="pt-2 border-t border-white/20">
                    <p className="text-[9px] md:text-[10px] text-white/80 text-center drop-shadow-sm">
                      Es gelten die{" "}
                      <a href="/teilnahmebedingungen" target="_blank" className="underline text-amber-300 font-semibold hover:text-amber-200">
                        Teilnahmebedingungen
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}