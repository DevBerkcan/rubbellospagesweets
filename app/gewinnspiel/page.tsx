"use client";

import { useEffect } from "react";
import GoldenTicketForm from "../components/GoldenTicketForm";
import Footer from "../components/Footer";

export default function GewinnspielPage() {
  useEffect(() => {
    // Page title
    document.title = "Rubbellos Gewinnspiel - Sweets aus aller Welt";
  }, []);

  return (
    <>
      <GoldenTicketForm />
      <Footer />
    </>
  );
}
