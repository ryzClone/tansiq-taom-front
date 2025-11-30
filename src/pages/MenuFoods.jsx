// src/pages/MenuFoods.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/MenuFoods.css";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext"; // ← toast

// .env: REACT_APP_API=http://your-api
const API_BASE =
  process.env.REACT_APP_API ||
  import.meta?.env?.VITE_API ||            // agar Vite bo‘lsa
  "";                                       // fallback

// Agar rasm ID bo‘lsa shu yo‘lga chaqirasiz (kerak bo‘lsa o‘zgartiring)
const getImgUrl = (attachmentUrl) => {
  if (!attachmentUrl) return null;

  // to‘liq URL bo‘lsa (http, https)
  if (attachmentUrl.startsWith("http")) {
    return attachmentUrl;
  }

  // to‘liq URL emas → ID yoki fayl nomi
  return `${API_BASE}/attachments/${attachmentUrl}`;
};


const fmtPrice = (num) => {
  try { return `${Number(num || 0).toLocaleString("uz-UZ")} so‘m`; }
  catch { return `${num} so‘m`; }
};

export default function MenuFoods() {
  const navigate = useNavigate();
  const { cateringId, menuId } = useParams();
  const [sp, setSp] = useSearchParams();

  const { add } = useCart();
  const { addNotification } = useNotification?.() || {}; // provider bo‘lmasa xato bermasin

  const pageFromUrl = Number(sp.get("page") || 0);
  const sizeFromUrl = Number(sp.get("size") || 12);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    size: sizeFromUrl,
    number: pageFromUrl,
    totalElements: 0,
    totalPages: 0,
  });

  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!menuId) return;
      setLoading(true);
      setErr("");
      try {
        const qs = new URLSearchParams();
        qs.set("page", String(pageFromUrl));
        qs.set("size", String(sizeFromUrl));
        // qs.append("sort", "name,asc"); // kerak bo‘lsa

        const url = `${API_BASE}/food/by-menu/${encodeURIComponent(String(menuId))}?${qs}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
          throw new Error(msg);
        }
        const data = await res.json();
        if (cancelled) return;

        setItems(Array.isArray(data?.content) ? data.content : []);
        setMeta({
          size: data?.page?.size ?? sizeFromUrl,
          number: data?.page?.number ?? pageFromUrl,
          totalElements: data?.page?.totalElements ?? 0,
          totalPages: data?.page?.totalPages ?? 0,
        });
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Yuklab bo‘lmadi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [API_BASE, menuId, pageFromUrl, sizeFromUrl]);

  // Client-side qidiruv
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (f) =>
        (f?.name || "").toLowerCase().includes(query) ||
        (f?.description || "").toLowerCase().includes(query)
    );
  }, [items, q]);

  // Pager -> URL
  const setPage = (p) => {
    const next = Math.max(0, Math.min(p, Math.max(0, (meta?.totalPages || 1) - 1)));
    setSp((prev) => {
      const n = new URLSearchParams(prev);
      n.set("page", String(next));
      n.set("size", String(sizeFromUrl));
      return n;
    }, { replace: true });
  };
  const setSize = (s) => {
    const size = Number(s) || 12;
    setSp((prev) => {
      const n = new URLSearchParams(prev);
      n.set("page", "0");
      n.set("size", String(size));
      return n;
    }, { replace: true });
  };

  return (
    <div className="foods-page">
      <div className="foods-toprow">
        <button className="back-btn back-btn--lg" onClick={() => navigate(`/catering/${cateringId}/menus`)}>
          ⟨ Menyular
        </button>

        <div className="foods-search">
          <span className="foods-search-ic">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Taom nomi yoki tavsifi bo‘yicha qidirish…"
          />
        </div>

        <label className="foods-size">
          <span>O‘lcham</span>
          <select value={sizeFromUrl} onChange={(e) => setSize(e.target.value)}>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={16}>16</option>
            <option value={24}>24</option>
          </select>
        </label>
      </div>

      {err && <div className="foods-error">{err}</div>}

      {loading ? (
        <div className="foods-grid">
          {Array.from({ length: sizeFromUrl }).map((_, i) => (
            <div key={i} className="food-card skeleton" />
          ))}
        </div>        
      ) : !shown.length ? (
        <div className="foods-empty">Taomlar topilmadi.</div>
      ) : (
        <div className="foods-grid">
          {shown.map((f, i) => {
            const url = getImgUrl(f.attachmentUrl);
            
            return (
              <article key={`${f.name}-${i}`} className="food-card">
                <div className="food-thumb">
                  {url ? (
                    <img src={url} alt={f.name} />
                  ) : (
                    <div className="food-thumb-ph" aria-hidden>
                      {(f.name || "F")[0]}
                    </div>
                  )}
                </div>

                <div className="food-body">
                  <h3 className="food-name" title={f.name}>{f.name}</h3>
                  <p className="food-desc">{f.description}</p>
                </div>

                <div className="food-foot">
                  <div className="food-price">{fmtPrice(f.price)}</div>
                  <button
                    className="food-btn"
                    type="button"
                    onClick={() => {
                      const key = `${menuId}:${f.name}`;
                      add({
                        key,
                        foodName: f.name,
                        description: f.description,
                        price: f.price,
                        attachmentUrl: f.attachmentUrl,
                        menuId,
                        cateringId,
                      }, 1);

                      // toast (bor bo‘lsa)
                      addNotification?.(`“${f.name}” savatchaga qo‘shildi`, "success");
                    }}
                  >
                    Savatchaga
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="foods-pager">
        <button className="pg-btn" disabled={meta.number <= 0} onClick={() => setPage(meta.number - 1)}>
          ⟨ Oldingi
        </button>
        <div className="pg-info">
          Sahifa {meta.number + 1} / {Math.max(1, meta.totalPages)}
          <span className="pg-sep">•</span>
          Jami: {meta.totalElements}
        </div>
        <button
          className="pg-btn"
          disabled={meta.number + 1 >= meta.totalPages}
          onClick={() => setPage(meta.number + 1)}
        >
          Keyingi ⟩
        </button>
      </div>
    </div>
  );
}
