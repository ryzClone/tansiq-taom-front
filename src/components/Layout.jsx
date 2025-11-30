// src/components/Layout.jsx
import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../styles/Layout.css";
import { useCart } from "../context/CartContext";

function readNotifCount() {
  try {
    const asNum = Number(localStorage.getItem("notifCount") || 0);
    return Number.isFinite(asNum) ? asNum : 0;
  } catch {
    return 0;
  }
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Cart kontekstdan jonli hisoblar
  const { count, total } = useCart();

  // init
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) setCollapsed(saved === "1");
    setNotifCount(readNotifCount());
  }, []);

  // storage sync
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "notifCount") setNotifCount(readNotifCount());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // collaps state saqlash
  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // NAV — endi count/total ga bog'langan
  const NAV = useMemo(
    () => [
      { href: "/",              label: "Bosh sahifa",      emoji: "🏠" },
      { href: "/catering",      label: "Kateringlar",      emoji: "🏢" },
      { href: "/cart",          label: "Savatcha",         emoji: "🛒", badge: count, total },
      { href: "/orders",        label: "Buyurtmalar",      emoji: "📦" },
      { href: "/help",          label: "Yordam",           emoji: "❓" },
    ],
    [count, total, notifCount] // ← muhim
  );

  return (
    <div className="layout">
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className="collapse-btn"
          title={collapsed ? "Kengaytirish" : "Yig'ish"}
          aria-expanded={!collapsed}
        >
          {collapsed ? "›" : "‹"}
        </button>

        <div className="brand">
          <div className="brand-icon" />
          {!collapsed && (
            <div className="brand-text">
              <div className="brand-title">Tansiq Taom</div>
              <div className="brand-subtitle">Client</div>
            </div>
          )}
        </div>

        <nav className="nav">
          {NAV.map(item => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                ["nav-link", collapsed ? "is-collapsed" : "", isActive ? "active" : ""].join(" ")
              }
            >
              <span className="active-indicator" />
              <span className="emoji-wrap">
                <span className="emoji">{item.emoji}</span>

                {/* Collapsed holatda suzuvchi badge */}
                {collapsed && typeof item.badge === "number" && item.badge > 0 && (
                  <span className="badge-floating">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </span>

              {!collapsed && <span className="label">{item.label}</span>}

              {/* Kengaygan holatda o‘ng tomonda badge */}
              {!collapsed && typeof item.badge === "number" && item.badge > 0 && (
                <span className="badge">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
