import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Catering.css";
import Select from "react-select";

export default function Caterings() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  // UI states
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState("top");
  const [view, setView] = useState("cards");

  // Pagination (infinite)
  const [page, setPage] = useState(0);
  const size = 9;
  const apiSort = ["name,asc"];

  const API_BASE = process.env.REACT_APP_API;

  // Data
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Sentinel for infinite scroll
  const loadMoreRef = useRef(null);

  // === FETCH: /organization/list?pageable.page=&pageable.size=&pageable.sort=
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
        // Agar serverda qidiruv bo‘lsa, qo‘shing:
        // params.set("search.search", query || "");

        const url = `${API_BASE}/organization/list?${params.toString()}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const content = Array.isArray(json?.content) ? json.content : [];

        const mapped = content.map((o, i) => ({
          id: o.id ?? o.uuid ?? `${page}-${i}`,
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

        if (cancelled) return;

        // append / replace
        setItems((prev) => (page === 0 ? mapped : [...prev, ...mapped]));
        setTotalPages(Number(json?.page?.totalPages) || 1);
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
  }, [API_BASE, page, size]);

  // IntersectionObserver — sentinel ko‘ringanda navbatdagi sahifa
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const onIntersect = (entries) => {
      const [entry] = entries;
      const hasMore = page + 1 < totalPages;
      if (entry.isIntersecting && hasMore && !loading) {
        setPage((p) => p + 1);
      }
    };

    const obs = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: "200px", // oldindan yuklab boradi
      threshold: 0,
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, [page, totalPages, loading]);

  // Client-side filter/sort
  const filtered = useMemo(() => {
    let list = items;

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => (c.name || "").toLowerCase().includes(q));
    }
    if (openOnly) list = list.filter((c) => c.open);

    if (sort === "az")
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    // "top" uchun serverdan rating kelmayapti — o‘zgarishsiz qoldiramiz

    return list;
  }, [items, query, openOnly, sort]);

    
    const options = filtered.map((c) => ({      
      value: c.id,   
      label: c.name
    }));

  const goMenus = (cateringId) => navigate(`/food/by-organization/${cateringId}`);

  const initialLoading = loading && page === 0 && items.length === 0;
  const hasMore = page + 1 < totalPages;

  const handleChange = (value) => {
    setSelected(value);

    // Backendga yuborish
    // value: [{value,label}, ...] => server uchun array of values
    const payload = value.map((v) => v.value);

    fetch(API_BASE, {
      method: "POST", // yoki PUT
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selected: payload }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Backend response:", data);
      })
      .catch((err) => console.error(err));
  };

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
              // faqat client-side qidiruv — listni saqlaymiz, sahifani reset qilamiz
              setPage(0);
              setItems([]); // 0-sahifani qayta olish uchun tozalaymiz (aks holda append bo‘lishi mumkin)
            }}
            placeholder="Katering yoki oshxona…"
          />
        </div>

        <Select
          isMulti
          options={options}
          value={selected}
          onChange={handleChange}
          className="basic-multi-select"
          classNamePrefix="select"
          placeholder="Texnikani tanlang..."
        />

        <div className="cat-view">
          <button
            className={view === "cards" ? "is-active" : ""}
            onClick={() => setView("cards")}
          >
            Cards
          </button>
        </div>
      </div>

      {err && (
        <div style={{ color: "#b91c1c", marginBottom: 12 }}>Xatolik: {err}</div>
      )}

      {/* Grid */}
      {initialLoading ? (
        <div className="cat-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cat-card skeleton" />
          ))}
        </div>
      ) : (
        <>
          <div className="cat-grid">
            {filtered.map((c) => (
              <article key={c.id} className="cat-card">
                <div className="cat-head">
                  <h3 className="cat-title">{c.name}</h3>
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="cat-logo" />
                  ) : (
                    <div className="cat-logo" aria-hidden />
                  )}
                </div>

                <div className="cat-line">
                  <div className="cat-fee">
                    <span className="eta">
                      {c.openTime?.slice(0, 5)} - {c.closeTime?.slice(0, 5)}
                    </span>
                  </div>

                  {/* Active dot (matnsiz) */}
                  <div className={`cat-open ${c.open ? "on" : "off"}`}>
                    <span
                      className="status-icon"
                      title={c.open ? "Active" : "Inactive"}
                    />
                  </div>
                </div>

                <button className="cat-viewbtn" onClick={() => goMenus(c.id)}>
                  Menyuni ko'rish
                </button>
              </article>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} style={{ height: 48 }} />

          {/* “Yuklanmoqda…” indikator (faqat keyingi sahifalarda) */}
          {loading && page > 0 && (
            <div style={{ textAlign: "center", padding: 12, color: "#64748b" }}>
              Yuklanmoqda…
            </div>
          )}

          {/* {!hasMore && !loading && filtered.length > 0 && (
            <div style={{ textAlign: "center", padding: 10, color: "#94a3b8" }}>
              Natijalar tugadi
            </div>
          )} */}
        </>
      )}
    </div>
  );
}
