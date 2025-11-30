// src/components/LangSwitch.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/LangSwitch.css";

const DEFAULT_LANGS = [
  { code: "uz", label: "O‘zbekcha", flag: "🇺🇿", dir: "ltr" },
  { code: "ru", label: "Русский",   flag: "🇷🇺", dir: "ltr" },
  // { code: "en", label: "English",   flag: "🇬🇧", dir: "ltr" }, // xohlasangiz qo‘shasiz
];

export default function LangSwitch({
  className = "",
  langs = DEFAULT_LANGS,
  storageKey = "lang",         // localStorage kaliti
  cookieName = "lang",         // ixtiyoriy: cookie ham qo’yamiz
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const current = useMemo(() => {
    const cur = (i18n.language || "uz").toLowerCase();
    return (
      langs.find(L => cur.startsWith(L.code.toLowerCase())) ||
      langs[0]
    );
  }, [i18n.language, langs]);

  // tashqariga bosilganda yopish
  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // boshqa tabda o‘zgarsa — sinxronlash
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === storageKey && e.newValue) {
        i18n.changeLanguage(e.newValue);
        applyHtmlMeta(e.newValue, langs);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [i18n, langs, storageKey]);

  const applyHtmlMeta = (lng, langsList) => {
    try {
      const meta = langsList.find(l => lng.startsWith(l.code)) || langsList[0];
      document.documentElement.lang = meta.code;
      document.documentElement.dir = meta.dir || "ltr";
    } catch {}
  };

  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    applyHtmlMeta(lng, langs);

    try { localStorage.setItem(storageKey, lng); } catch {}
    try {
      // 30 kunlik cookie
      document.cookie = `${cookieName}=${encodeURIComponent(lng)}; Path=/; Max-Age=${30*24*60*60}; SameSite=Lax`;
    } catch {}

    // global event (ixtiyoriy) — ichki tizim boshqa joylarida tinglash mumkin
    try { window.dispatchEvent(new CustomEvent("lang-changed", { detail: { lang: lng } })); } catch {}
    setOpen(false);
  };

  return (
    <div className={`langbox ${className}`} ref={boxRef}>
      <button
        type="button"
        className="langbtn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        title={`${current.label}`}
      >
        <span className="flag">{current.flag}</span>
        <span className="code">{current.code.toUpperCase()}</span>
        <svg className={`chev ${open ? "rot" : ""}`} viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="langmenu" role="menu">
          {langs.map((l) => {
            const active = current.code === l.code;
            return (
              <button
                key={l.code}
                type="button"
                role="menuitem"
                className={`langitem ${active ? "active" : ""}`}
                onClick={() => setLang(l.code)}
              >
                <span className="flag">{l.flag}</span>
                <span className="label">{l.label}</span>
                {active && <span className="dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
