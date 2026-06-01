"use client";

import { useEffect, useState } from "react";

export default function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const text = `${title} — no Há Caracóis 🐌`;
  const enc = encodeURIComponent;

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* utilizador cancelou */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignora */
    }
  }

  const links = [
    {
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/?text=${enc(`${text} ${url}`)}`,
    },
    {
      label: "Telegram",
      icon: "✈️",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    },
    {
      label: "Email",
      icon: "✉️",
      href: `mailto:?subject=${enc(title)}&body=${enc(`${text}\n${url}`)}`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {canNativeShare && (
        <button
          onClick={nativeShare}
          className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          🔗 Partilhar
        </button>
      )}
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <span>{l.icon}</span> {l.label}
        </a>
      ))}
      <button
        onClick={copy}
        className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        {copied ? "✓ Copiado" : "🔗 Copiar link"}
      </button>
    </div>
  );
}
