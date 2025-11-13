"use client";

import { motion } from "framer-motion";
import { ChevronRight, Gift } from "lucide-react";
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

    if (!data.ticketCode || !/^[A-Z0-9]{8}$/.test(data.ticketCode)) {
      contactForm.setError("ticketCode", {
        type: "manual",
        message: "Bitte gib einen gültigen 8-stelligen Code ein",
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
      alert(
        error.message || "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
      );
      submittedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // SUCCESS
  if (step === "done") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm mx-auto relative z-10 px-4"
        >
          <h1 className="text-xl font-bold mb-3">TEILNAHME BESTÄTIGT!</h1>
          <p className="text-gray-700 mb-3 text-sm">
            Deine Teilnahme wurde erfolgreich registriert!
          </p>
          <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
            <p className="text-xs text-gray-600">
              {newsletterOptIn
                ? "Bitte bestätige deine Newsletter-Anmeldung in der E-Mail (Double-Opt-In)."
                : "Deine Teilnahme wurde gespeichert!"}
            </p>
            <p className="text-[11px] text-gray-500">
              Der Gewinner wird nach Ende des Teilnahmezeitraums (24.12.2025)
              per E-Mail benachrichtigt.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // FORM (responsive)
  return (
    <div className="relative min-h-screen flex items-end justify-center px-4 pb-6 pt-20 overflow-hidden md:items-center md:pt-0">
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

      <div className="container mx-auto relative z-10 max-w-sm md:max-w-md">
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
              <div className="bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 rounded-[32px] p-[2px] shadow-xl md:rounded-3xl">
                <div className="bg-sky-900/40 rounded-[30px] px-5 py-3 flex items-center justify-center gap-2 md:px-6 md:py-4">
                  <Gift className="w-4 h-4 text-white/80 md:w-5 md:h-5" />
                  <input
                    type="text"
                    placeholder="••••••••"
                    {...contactForm.register("ticketCode", {
                      required: "Code ist erforderlich",
                      pattern: {
                        value: /^[A-Z0-9]{8}$/,
                        message:
                          "Bitte gib einen gültigen 8-stelligen Code ein",
                      },
                    })}
                    maxLength={8}
                    className="w-full bg-transparent border-none outline-none text-center text-lg tracking-[0.4em] text-white font-semibold placeholder:text-white/60 uppercase md:text-xl"
                    style={{ letterSpacing: "0.4em" }}
                  />
                </div>
              </div>
              {contactForm.formState.errors.ticketCode && (
                <p className="text-red-300 text-[11px] mt-1 text-center font-medium md:text-sm">
                  {String(contactForm.formState.errors.ticketCode.message)}
                </p>
              )}
            </div>

            {/* Vorname / Nachname */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Toan"
                  {...contactForm.register("firstName", {
                    required: "Vorname ist erforderlich",
                    minLength: { value: 2, message: "Mindestens 2 Zeichen" },
                  })}
                  className="w-full px-4 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md border border-white/40 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-5 md:py-3 md:text-sm"
                />
                {contactForm.formState.errors.firstName && (
                  <p className="text-red-300 text-[11px] mt-1 text-left md:text-xs">
                    {String(contactForm.formState.errors.firstName.message)}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Pham"
                  {...contactForm.register("lastName", {
                    required: "Nachname ist erforderlich",
                    minLength: { value: 2, message: "Mindestens 2 Zeichen" },
                  })}
                  className="w-full px-4 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md border border-white/40 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-5 md:py-3 md:text-sm"
                />
                {contactForm.formState.errors.lastName && (
                  <p className="text-red-300 text-[11px] mt-1 text-left md:text-xs">
                    {String(contactForm.formState.errors.lastName.message)}
                  </p>
                )}
              </div>
            </div>

            {/* E-Mail / Telefon */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div>
                <input
                  type="email"
                  placeholder="toan@padesign.io"
                  {...contactForm.register("email", {
                    required: "E-Mail ist erforderlich",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message:
                        "Bitte gib eine gültige E-Mail Adresse ein",
                    },
                  })}
                  className="w-full px-4 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md border border-white/40 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-5 md:py-3 md:text-sm"
                />
                {contactForm.formState.errors.email && (
                  <p className="text-red-300 text-[11px] mt-1 text-left md:text-xs">
                    {String(contactForm.formState.errors.email.message)}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="+49 151 ..."
                  {...contactForm.register("phone")}
                  className="w-full px-4 py-2 rounded-full bg-white/95 text-gray-900 text-xs shadow-md border border-white/40 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-5 md:py-3 md:text-sm"
                />
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
              <p className="text-red-300 text-[10px] -mt-1 font-medium md:text-xs">
                {consentError}
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
                <span className="font-bold text-amber-300">🎁 BONUS:</span> Ja,
                ich möchte den Newsletter von Sweets aus aller Welt per E-Mail
                erhalten.
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
      </div>
    </div>
  );
}