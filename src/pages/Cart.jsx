import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/Cart.css";

const fmt = (n) => `${Number(n||0).toLocaleString("uz-UZ")} so‘m`;

export default function Cart() {
  const nav = useNavigate();
  const { items, inc, dec, removeAllSame, clear, total } = useCart();  

  const partner =
    items?.find((x) => x.cateringName || x.organizationName || x.partnerName)
      ?.cateringName ||
    items?.find((x) => x.organizationName)?.organizationName ||
    items?.find((x) => x.partnerName)?.partnerName ||
    "";

  return (
    <div className="cart-page">
      <div className="cart-top new-top">
        <button
          className="back-btn back-btn--float back-right"
          onClick={() => nav(-1)}
        >
          Orqaga ⟩
        </button>
        <h1 className="cart-title">
          Savatcha {partner ? `— ${partner}` : ""}
        </h1>
      </div>

      {!items.length ? (
        <div className="cart-empty">Savatcha bo‘sh</div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((it) => {
              const lineTotal = Number(it.price) * Number(it.qty);

              return (
                <article key={it.key} className="cart-item">
                  <div className="cart-thumb">
                    {it.attachmentUrl ? (
                      <img src={it.attachmentUrl} alt={it.foodName} />
                    ) : (
                      <div className="cart-thumb-ph">
                        {(it.foodName || "F")[0]}
                      </div>
                    )}
                  </div>

                  <div className="cart-body">
                    <div className="cart-name">{it.foodName}</div>
                    {it.description && (
                      <div className="cart-desc">{it.description}</div>
                    )}
                  </div>

                  <div className="cart-ctrls new-ctrls">

                    <div className="cart-ctrls-body">
                      <div className="qty qty-lg">
                        <button onClick={() => dec(it.key)}>−</button>
                        <span>{it.qty}</span>
                        <button onClick={() => inc(it.key)}>+</button>
                      </div>
                      <button className="rmv" onClick={() => removeAllSame(it)}>
                        O‘chirish
                      </button>
                    </div>

                    <div className="cart-price-row">
                      Narx: <strong>{fmt(lineTotal)}</strong>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>

          <div className="cart-summary">
            <div className="total">
              Jami: <strong>{fmt(total)}</strong>
            </div>
            <div className="actions">
              <button className="ghost" onClick={clear}>
                Tozalash
              </button>
              <button
                className="primary"
                onClick={() => alert("Checkout (demo)")}
              >
                Buyurtma berish
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
