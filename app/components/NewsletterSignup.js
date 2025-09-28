"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Mail, Gift, Star } from "lucide-react";
import { FunnelTracker } from "../../lib/funnel";
import { trackEvent } from "../../lib/tracking";

// Typdefinition entfernt, stattdessen JSDoc für Klarheit:
/**
 * @typedef {Object} FormValues
 * @property {string} email
 * @property {string} [firstName]
 * @property {string} [source]
 */

export default function NewsletterSignup({ source = "standard" }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const funnel = new FunnelTracker();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError(null);

    try {
      funnel.trackEmailCapture(data.email);
      trackEvent("lead", { email: data.email });

      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setServerError(payload?.error || payload?.message || "Etwas ist schiefgelaufen.");
        return;
      }

      setIsSubmitted(true);
      trackEvent("complete_registration", { method: "newsletter", source });
    } catch (e) {
      setServerError(e?.message || "Netzwerkfehler.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-500 to-green-600 p-8 rounded-2xl text-white text-center"
      >
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold mb-2">Willkommen in der Sweet Community!</h3>
        <p className="mb-4">
          Du erhältst gleich eine Bestätigungs-E-Mail
          {/* Tipp: für Double-Opt-In auf „pending“ umstellen, siehe API */}
          {` mit deinem 15% Rabattcode!`}
        </p>
        <div className="bg-white/20 p-3 rounded-lg">
          <p className="text-sm font-medium">📧 Prüfe dein E-Mail-Postfach</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-8 rounded-3xl">
      <div className="text-center mb-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block text-4xl mb-3"
        >
          🍭
        </motion.div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Süße Belohnungen warten!
        </h2>
        <p className="text-gray-600">
          Melde dich jetzt an und erhalte exklusive Angebote direkt in dein Postfach
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-full">
          <Gift className="w-4 h-4 text-pink-500" />
          <span className="text-sm font-medium">15% Rabatt</span>
        </div>
        <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-full">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">VIP Zugang</span>
        </div>
        <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-full">
          <Mail className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">Exklusiv</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Deine E-Mail Adresse"
            {...register("email", {
              required: "E-Mail ist erforderlich",
              pattern: { value: /\S+@\S+\.\S+/, message: "Ungültige E-Mail Adresse" },
            })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <input
            type="text"
            placeholder="Dein Vorname (optional)"
            {...register("firstName")}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
          />
        </div>

        {serverError && (
          <p className="text-red-600 text-sm">{serverError}</p>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all transform disabled:opacity-70"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Anmeldung läuft...
            </span>
          ) : (
            "🎁 Jetzt 15% Rabatt sichern!"
          )}
        </motion.button>
      </form>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Mit der Anmeldung stimmst du unseren{" "}
        <a href="/datenschutz" className="underline">Datenschutzbestimmungen</a> zu.
        Abmeldung jederzeit möglich.
      </p>
    </div>
  );
}