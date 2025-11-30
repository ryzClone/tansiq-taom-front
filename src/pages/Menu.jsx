// src/pages/Menus.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../styles/Menus.css";

const MOCK_MENUS = {
  content: [
    { id: 101, name: "Nonushta menyusi",  date: "2025-11-30" },
    { id: 102, name: "Tushlik menyusi",   date: "2025-12-01" },
    { id: 103, name: "Kechki taomlar",    date: "2025-12-01" },
    { id: 104, name: "Fit-Menu (haftalik)", date: "2025-12-02" },
  ],
  page: { size: 12, number: 0, totalElements: 4, totalPages: 1 },
};

const USE_MOCK = false;

// 🔑 .env: REACT_APP_API=https://your-host/api
const API_BASE = (process.env.REACT_APP_API || "http://localhost:8084/tansiq").replace(/\/+$/,"");

// ❗️Swagger’da query kalitlari object ko‘rinishida bo‘lsa:
const PREFIXED_KEYS = false; // kerak bo‘lsa true qiling
const DEFAULT_SORT = ["date,desc"];

function buildMenuQuery({ search, page = 0, size = 12, sort = DEFAULT_SORT }) {
  const sp = new URLSearchParams();
  const k = (name) =>
    PREFIXED_KEYS
      ? name === "search" ? "filterDto.search"
      : name === "page"   ? "pageable.page"
      : name === "size"   ? "pageable.size"
      : name === "sort"   ? "pageable.sort"
      : name
      : name;

  if (search && search.trim()) sp.set(k("search"), search.trim());
  sp.set(k("page"), String(page));
  sp.set(k("size"), String(size));
  sort.forEach((s) => sp.append(k("sort"), s));
  return sp.toString();
}

export default function Menus() {
  const navigate = useNavigate();
  const { cateringId } = useParams();       // /catering/:cateringId/menus
  const [sp, setSp] = useSearchParams();

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
      if (!cateringId) return;              // id bo‘lmasa chiqib ketamiz
      setLoading(true);
      setErr("");

      try {
        if (USE_MOCK) {
          const data = {
            ...MOCK_MENUS,
            page: { ...MOCK_MENUS.page, size: sizeFromUrl, number: pageFromUrl },
          };
          if (!cancelled) {
            setItems(data.content);
            setMeta(data.page);
          }
          return;
        }

        const token = localStorage.getItem("accessToken") || "";
        const qs = buildMenuQuery({
          search: q,
          page: pageFromUrl,
          size: sizeFromUrl,
          sort: DEFAULT_SORT,
        });

        const url = `${API_BASE}/menu/by-organization/${encodeURIComponent(String(cateringId))}?${qs}`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
          throw new Error(msg);
        }

        const data = await res.json();
        if (!cancelled) {
          setItems(Array.isArray(data?.content) ? data.content : []);
          setMeta({
            size: data?.page?.size ?? sizeFromUrl,
            number: data?.page?.number ?? pageFromUrl,
            totalElements: data?.page?.totalElements ?? 0,
            totalPages: data?.page?.totalPages ?? 0,
          });
        }
      } catch (e) {
        // fallback mock
        const data = {
          ...MOCK_MENUS,
          page: { ...MOCK_MENUS.page, size: sizeFromUrl, number: pageFromUrl },
        };
        if (!cancelled) {
          setErr(e?.message || "Yuklab bo‘lmadi (mock ko‘rsatildi)");
          setItems(data.content);
          setMeta(data.page);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [cateringId, pageFromUrl, sizeFromUrl, q]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((m) => (m?.name || "").toLowerCase().includes(query));
  }, [items, q]);

  const fmtDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("uz-UZ", { year: "numeric", month: "short", day: "2-digit" });
    } catch { return iso; }
  };

  const goDetails = (menuId) => navigate(`/catering/${cateringId}/menus/${menuId}/foods`);

  const setPage = (p) => {
    const max = Math.max(0, (meta?.totalPages || 1) - 1);
    const next = Math.min(Math.max(0, p), max);
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
    <div className="menus-page">
      <div className="menus-toolbar foods-toprow">
        <button
        className="back-btn back-btn--lg"
        onClick={() => navigate(`/catering`)}
      >
        ⟨ Keteringlar
      </button>

        <div className="menus-search">
          <span className="menus-search-ic">🔎</span>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Menyu nomi bo‘yicha qidirish…"
          />
        </div>

        <div className="menus-right">
          <label className="menus-size">
            <span>Sahifa o‘lchami</span>
            <select value={sizeFromUrl} onChange={(e) => setSize(e.target.value)}>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={24}>24</option>
            </select>
          </label>
        </div>
      </div>

      {err && <div className="menus-error">{err}</div>}

      {loading ? (
        <div className="menus-grid">
          {Array.from({ length: sizeFromUrl }).map((_, i) => (
            <div key={i} className="menu-card skeleton" />
          ))}
        </div>
      ) : (
        <>
          {!shown.length ? (
            <div className="menus-empty">Menyular topilmadi.</div>
          ) : (
            <div className="menus-grid">
              {shown.map((m) => (
                <article key={m.id} className="menu-card">
                  <div className="menu-head">
                    <h3 className="menu-title">{m.name}</h3>
                    <div className="menu-date">{fmtDate(m.date)}</div>
                  </div>
                  <div className="menu-foot">
                    <button className="menu-btn" onClick={() => goDetails(m.id)}>
                      Taomlarni ko‘rish
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="menus-pager">
            <button className="pg-btn" disabled={meta.number <= 0} onClick={() => setPage(meta.number - 1)}>
              ⟨ Oldingi
            </button>
            <div className="pg-info">
              Sahifa {meta.number + 1} / {Math.max(1, meta.totalPages)}
              <span className="pg-sep">•</span>
              Jami: {meta.totalElements}
            </div>
            <button className="pg-btn" disabled={meta.number + 1 >= meta.totalPages} onClick={() => setPage(meta.number + 1)}>
              Keyingi ⟩
            </button>
          </div>
        </>
      )}
    </div>
  );
}
