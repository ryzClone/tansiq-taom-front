import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Catering.css";

export default function Caterings() {
  const navigate = useNavigate();
  // UI states
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState("top"); // UI sort (client-side)
  const [view, setView] = useState("cards");

  // Pagination for API
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const apiSort = ["name,asc"]; // <-- backendga ketadigan sort massiv (kerak bo'lsa o'zgartirasiz)
  const API_BASE = process.env.REACT_APP_API;
  // Data
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  // ==== FETCH /organization/list?pageable.page=&pageable.size=&pageable.sort=
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const params = new URLSearchParams();
        params.set("pageable.page", String(page));
        params.set("pageable.size", String(size));
        apiSort.forEach((s) => params.append("pageable.sort", s));

        // Agar backendda search object kerak bo'lsa, qo'shish mumkin:
        // params.set("search.search", query || "");

        const url = `${API_BASE}/organization/list?${params.toString()}`;

        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const content = Array.isArray(json?.content) ? json.content : [];
        

        // Backend maydonlarini karta ko‘rinishiga moslab map qilamiz
        const mapped = content.map((o, i) => ({
          id: o.id ?? o.uuid ?? i + 1,
          name: o.name ?? "—",
          openTime: o.openTime ?? "09:00",
          closeTime: o.closeTime ?? "18:00",
          open:
            typeof o.isOpen === "boolean"
              ? o.isOpen
              : typeof o.closed === "boolean"
              ? !o.closed
              : true,
          logoUrl: o.attachmentUrl,
        }));

        if (!cancelled) {
          setItems(mapped);
          setTotalPages(Number(json?.page?.totalPages) || 1);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Yuklab bo‘lmadi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, size]); // (query ni serverga yubormayotgan bo'lsak, dependencyga qo'shmaymiz)

  // Client-side filter/sort (faqat UI uchun)
  const filtered = useMemo(() => {
    let list = items.slice();

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => (c.name || "").toLowerCase().includes(q));
    }
    if (openOnly) list = list.filter((c) => c.open);

    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "top") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return list;
  }, [items, query, openOnly, sort]);

  const goMenus = (cateringId) => navigate(`/catering/${cateringId}/menus`);

  return (
    <div className="cat-page">
      {/* Toolbar */}
      <div className="cat-toolbar">
        <div className="cat-search">
          <span className="cat-search-ic">🔍</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0); // qidiruv o'zgarsa 1-sahifaga qaytamiz (agar keyin serverga ham yuborsangiz, effectga qo'shasiz)
            }}
            placeholder="Katering yoki oshxona…"
          />
        </div>

        <div className="cat-view">
          <button
            className={view === "cards" ? "is-active" : ""}
            onClick={() => setView("cards")}
          >
            Cards
          </button>
        </div>
      </div>

      {err && <div style={{ color: "#b91c1c", marginBottom: 12 }}>Xatolik: {err}</div>}

      {loading ? (
        <div className="cat-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cat-card skeleton" />
          ))}
        </div>
      ) : (
        <div className="cat-grid">
          {filtered.map((c) => (
            <article key={c.id} className="cat-card">
              <div className="cat-head">
                <h3 className="cat-title">{c.name}</h3>
                <img src={c.logoUrl} alt="" className="cat-logo" />
              </div>

              <div className="cat-line">
                <div className="cat-fee">
                  <span className="eta">
                    {c.openTime} – {c.closeTime}
                  </span>
                </div>
                <div className={`cat-open ${c.open ? "on" : "off"}`}>
                  {c.open ? "Hozir ochiq" : "Hozir yopiq"}
                </div>
              </div>

              <button className="cat-viewbtn" onClick={() => goMenus(c.id)}>
                Menyuni ko'rish
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Pager */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}>
        <button className="pg-btn" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
          ⟨ Oldingi
        </button>
        <div className="pg-info">
          Sahifa {page + 1} / {Math.max(1, totalPages)}
        </div>
        <button
          className="pg-btn"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Keyingi ⟩
        </button>
      </div>
    </div>
  );
}
