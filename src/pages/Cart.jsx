import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/Cart.css";

const fmt = (n) => `${Number(n||0).toLocaleString("uz-UZ")} so‘m`;

export default function Cart() {
  const nav = useNavigate();
  const { items, inc, dec, remove, clear, total } = useCart();

  return (
    <div className="cart-page">
      <div className="cart-top">
        <button className="back-btn" onClick={() => nav(-1)}>⟨ Orqaga</button>
        <h1 className="cart-title">Savatcha</h1>
      </div>

      {!items.length ? (
        <div className="cart-empty">Savatcha bo‘sh</div>
      ) : (
        <>
          <div className="cart-list">
            {items.map(it => (
              <article key={it.key} className="cart-item">
                <div className="cart-thumb">
                  {it.attachmentId ? (
                    <img src={`/api/attachments/${it.attachmentId}`} alt={it.foodName} />
                  ) : (
                    <div className="cart-thumb-ph">{(it.foodName || "F")[0]}</div>
                  )}
                </div>

                <div className="cart-body">
                  <div className="cart-name">{it.foodName}</div>
                  {it.description && <div className="cart-desc">{it.description}</div>}
                  <div className="cart-price">{fmt(it.price)}</div>
                </div>

                <div className="cart-ctrls">
<div className="qty">
  <button onClick={() => dec(it.key)}>-</button>
  <span>{it.qty}</span> {/* Shu yerda raqam chiqadi */}
  <button onClick={() => inc(it.key)}>+</button>
</div>

                  <button className="rmv" onClick={() => remove(it.key)}>O‘chirish</button>
                </div>
              </article>
            ))}
          </div>

          <div className="cart-summary">
            <div className="total">
              Jami: <strong>{fmt(total)}</strong>
            </div>
            <div className="actions">
              <button className="ghost" onClick={clear}>Tozalash</button>
              <button className="primary" onClick={() => alert("Checkout (demo)")}>
                Buyurtma berish
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
