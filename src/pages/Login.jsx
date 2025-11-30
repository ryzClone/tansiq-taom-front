// src/pages/Login.jsx
import "../i18n"; 
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useTranslation } from "react-i18next";
import LangSwitch from "../components/LangSwitch";
import "../styles/Login.css";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


export default function Login() {
  const { setToken } = useContext(AuthContext);
  const { t } = useTranslation();               // <-- i18n
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      // Bu xabarni ham xohlasangiz keyin JSONlarga qo'shamiz
    addNotification(t("login_error"), "error");
      return;
    }

    try {
      setPending(true);
      await new Promise((r) => setTimeout(r, 700)); // demo delay 

      const accessToken = btoa(`${username}:${Date.now()}`);
      const refreshToken = btoa(`${username}:refresh:${Date.now()}`);

      try {
        setToken(accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        document.cookie = `accessToken=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `refreshToken=${encodeURIComponent(refreshToken)}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      } catch {}

      addNotification(t("login_success"), "success");

      navigate("/");
    } catch (err) {
      addNotification?.("Kirishda xatolik yuz berdi");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login-grid">
      {/* LEFT: Hero panel (lg+) */}
      <section className="hero-panel" aria-hidden="true">
        <div className="hero-bg" />
        <div className="hero-decor circle-a" />
        <div className="hero-decor circle-b" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="brand">
            <div className="brand-mark" />
            <div>
              <div className="brand-title">Tansiq Taom</div>
              <div className="brand-sub">Admin boshqaruv paneli</div>
            </div>
          </div>

          <h2 className="hero-heading">
            {t("hero_title")}
            <br />
            {t("hero_title2")}
          </h2>

          <ul className="hero-list">
            <li>Cutoff vaqtlari, menyular va zaxiralarni bir joyda.</li>
            <li>Buyurtmalar statusi: cooking → packaging → delivered.</li>
            <li>Statistikalar va tezkor bildirishnomalar.</li>
          </ul>
        </div>
      </section>

      {/* RIGHT: Form card */}
      <section className="form-section">
        {/* Til tugmalari (UI ni buzmaydi) */}

<div className="lang-body">
  <LangSwitch className="lang-switch" />
</div>


        <div className="card">
          <form onSubmit={onSubmit} className="form-stack" aria-label="Login form">
            <div>
              <label className="label">{t("username")}</label>
              <input
                className="input"
                type="text"
                placeholder="user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label">{t("password")}</label>

              <div className="password-wrapper">
                <input
                  className="input password-input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="row-between">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox" />
                <span>{t("remember")}</span>
              </label>
            </div>

            <div>
              <button className="btn-primary full" type="submit" disabled={pending} aria-busy={pending}>
                {pending ? (
                  <span className="loading-inline" aria-hidden="true">
                    <span className="dot" />
                    <span className="dot delay" />
                    <span className="dot delay-more" />
                    {t("loading")}
                  </span>
                ) : (
                  t("login")
                )}
              </button>
            </div>

            <div className="divider">
              <span>{t("or")}</span>
            </div>

            <button
              type="button"
              className="btn-ghost full"
              onClick={() => addNotification?.(t("google") + " (demo)")}
            >
              {t("google")}
            </button>
          </form>
        </div>

        <p className="footer-note">
          © {new Date().getFullYear()} Tansiq Taom. Barcha huquqlar himoyalangan.
        </p>
      </section>
    </div>
  );
}
