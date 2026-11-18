
"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppChat() {
  const number = "8801767470490";

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(
        "Assalamu Alaikum, I would like to know more about LUBO TRADITIONS."
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Live Chat on WhatsApp"
      className="whatsapp-float"
    >
      <MessageCircle size={23} color="white" />
      <span className="whatsapp-label">LIVE CHAT</span>
    </a>
  );
}
