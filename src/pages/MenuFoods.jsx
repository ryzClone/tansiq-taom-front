// src/pages/MenuFoods.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/MenuFoods.css";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";

// .env: REACT_APP_API=http://your-api
const API_BASE = process.env.REACT_APP_API || import.meta?.env?.VITE_API || "";

// Rasm URL yig‘ish
const getImgUrl = (attachmentUrl) => {
  if (!attachmentUrl) return null;
  if (attachmentUrl.startsWith("http")) return attachmentUrl;
  return `${API_BASE}/attachments/${attachmentUrl}`;
};

const fmtPrice = (n) => {
  try {
    return `${Number(n || 0).toLocaleString("uz-UZ")} so‘m`;
  } catch {
    return `${n} so‘m`;
  }
};

export default function MenuFoods() {
  const navigate = useNavigate();
  const { cateringId, menuId } = useParams();

  // 🔹 Cart va Notification
  const { items: cartItems, add, inc, dec, remove, total } = useCart();
  const { addNotification } = useNotification();

  // 🔹 Infinite scroll holati
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(9); // sahifadagi elementlar (UI’da ko‘rsatilmaydi)
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // Modal holati
  const [modalFood, setModalFood] = useState(null);

  const loadMoreRef = useRef(null);

  // menuId o‘zgarsa listni tozalab, qayta startdan yuklaymiz
  useEffect(() => {
    setItems([]);
    setPage(0);
    setTotalPages(1);
    setErr("");
  }, [menuId]);

  // 🔻 To‘g‘ri endpoint: /food/by-menu/{menuId}
  useEffect(() => {
    let cancelled = false;
    if (!cateringId) return;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("size", String(size));
        // params.append("sort", "name,asc"); // kerak bo‘lsa

        const url = `${API_BASE}/food/by-organization/${String(
          cateringId
        )}?${params}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            if (j?.message) msg = j.message;
          } catch {}
          throw new Error(msg);
        }

        const data = await res.json();
        if (cancelled) return;

        const pageItems = Array.isArray(data?.content) ? data.content : [];
        setItems((prev) => (page === 0 ? pageItems : [...prev, ...pageItems]));
        setTotalPages(Number(data?.page?.totalPages) || 1);
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
  }, [API_BASE, menuId, page, size]);

  // modal ochilganda body scrollni bloklash
  useEffect(() => {
    if (modalFood) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [modalFood]);

  // IntersectionObserver — sentinel ko‘ringanda keyingi sahifa
  const hasMore = page + 1 < totalPages;
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading]);

  // Client-side qidiruv
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (f) =>
        (f?.name || "").toLowerCase().includes(s) ||
        (f?.description || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  // Cart’dagi qty ni olish (key: menuId:name)
  const getQty = (foodName) => {
    const key = `${menuId}:${foodName}`;
    const found = cartItems.find((x) => x.key === key);
    return found ? Number(found.qty || 0) : 0;
  };

  // ++ tugma
  const handleInc = (f) => {
    const key = `${menuId}:${f.name}`;
    const prevQty = getQty(f.name); // ✅ foodName yuboramiz

    add(
      {
        key,
        foodName: f.name,
        description: f.description,
        price: f.price,
        attachmentUrl: f.attachmentUrl,
        menuId,
        cateringId,
      },
      1
    );

    if (prevQty === 0) {
      addNotification(`“${f.name}” savatchaga qo‘shildi`, "success");
    }
  };

  // -- tugma
  const handleDec = (f) => {
    const key = `${menuId}:${f.name}`;
    const qty = getQty(f.name); // ✅ foodName yuboramiz
    if (qty <= 0) return;

    remove(key, 1); // ✅ 1 ta kamaytiradi
    if (qty === 1) {
      addNotification(`“${f.name}” savatchadan olib tashlandi`, "info");
    }
  };

  const initialLoading = loading && page === 0 && items.length === 0;

  return (
    <div className="foods-page">
      {/* TOP BAR: chapda “Menyular” , o‘rtada qidiruv, o‘ngda yashil korzinka tugma */}
      <div className="foods-toprow">
        <button
          className="back-btn back-btn--lg"
          onClick={() => navigate(`/catering`)}
        >
          ⟨ Kateringlar
        </button>

        <div className="foods-search">
          <span className="foods-search-ic">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Taom nomi yoki tavsifi bo‘yicha qidirish…"
          />
        </div>

        {/* Yashil korzinka tugmasi — umumiy narx */}
        <button
          className="cart-cta"
          onClick={() => navigate("/cart")}
          title="Savatchani ko‘rish"
        >
          <span className="ic">🛒</span>
          <span className="sum">{fmtPrice(total)}</span>
        </button>
      </div>

      {err && <div className="foods-error">{err}</div>}

      {initialLoading ? (
        <div className="foods-grid">
          {Array.from({ length: size }).map((_, i) => (
            <div key={i} className="food-card skeleton" />
          ))}
        </div>
      ) : !shown.length ? (
        <div className="foods-empty">Taomlar topilmadi.</div>
      ) : (
        <>
          <div className="foods-grid">
            {shown.map((f, i) => {
              const url = getImgUrl(f.attachmentUrl);
              const qty = getQty(f.name);

              return (
                <article
                  className="food-card"
                  onClick={() => !modalFood && setModalFood(f)}
                >
                  <div className="food-thumb" style={{ cursor: "pointer" }}>
                    {url ? (
                      <img src={url} alt={f.name} />
                    ) : (
                      <div className="food-thumb-ph" aria-hidden>
                        {(f.name || "F")[0]}
                      </div>
                    )}
                  </div>

                  <div className="food-body">
                    <h3 className="food-name" title={f.name}>
                      {f.name}
                    </h3>
                    <p className="food-desc">{f.description}</p>
                  </div>

                  <div className="food-foot">
                    <div className="food-price">{fmtPrice(f.price)}</div>

                    {/* UZUN YASHIL qty panel — sizning CSS bilan mos: qty-long */}
                    <div className="food-long">
                      <button
                        className="btn-minus"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDec(f);
                        }}
                        aria-label="Kamaysin"
                      >
                        −
                      </button>
                      <div className="qty-val">{qty}</div>

                      <button
                        className="btn-plus"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInc(f);
                        }}
                        aria-label="Ko‘paytirish"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {modalFood && (
                    <div className="mf-modal-overlay">
                      <div
                        className="mf-modal"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="mf-close"
                          onClick={() => setModalFood(null)}
                        >
                          ×
                        </button>

                        <div className="mf-img">
                          <img
                            src={getImgUrl(modalFood.attachmentUrl)}
                            alt={modalFood.name}
                          />
                        </div>

                        <h2 className="mf-title">{modalFood.name}</h2>
                        <p className="mf-desc">{modalFood.description}</p>

                        <div className="mf-bottom">
                          <div className="mf-price">
                            {fmtPrice(modalFood.price)}
                          </div>

                          <div className="mf-qty">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDec(modalFood);
                              }}
                              disabled={getQty(modalFood.name) === 0}
                            >
                              −
                            </button>

                            <span>{getQty(modalFood.name)}</span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInc(modalFood);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} style={{ height: 48 }} />

          {/* Keyingi sahifalar yuklanayotganda */}
          {loading && page > 0 && (
            <div style={{ textAlign: "center", padding: 12, color: "#64748b" }}>
              Yuklanmoqda…
            </div>
          )}
        </>
      )}
    </div>
  );
}
