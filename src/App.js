// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Catering from "./pages/Catering";
import Shoping from "./pages/Shoping";
import Help from "./pages/Help";
import Menus from "./pages/Menu";
import MenuFoods from "./pages/MenuFoods";
import Cart from "./pages/Cart";
import { CartProvider } from "./context/CartContext";

/*
function useAuthToken() {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("accessToken");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "accessToken") {
        try {
          setToken(localStorage.getItem("accessToken"));
        } catch {
          setToken(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return token;
}

function RequireAuth() {
  const token = useAuthToken();
  const location = useLocation();
  if (!token) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }
  return <Outlet />;
}

function RedirectIfAuthed() {
  const token = useAuthToken();
  const redirectTo = "/";
  if (token) return <Navigate to={redirectTo} replace />;
  return <Outlet />;
}
*/

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Public: Login (comment qilindi) */}
          {/* <Route element={<RedirectIfAuthed />}>
            <Route path="/login" element={<Login />} />
          </Route> */}

          {/* Protected: RequireAuth vaqtinchalik comment qilindi */}
          {/* <Route element={<RequireAuth />}> */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="catering" element={<Catering />} />
              <Route path="catering/:cateringId/menus" element={<Menus />} />
              <Route
                path="catering/:cateringId/menus/:menuId/foods"
                element={<MenuFoods />}
              />
              <Route path="shoping" element={<Shoping />} />
              <Route path="cart" element={<Cart />} />
              <Route path="orders" element={<Orders />} />
              <Route path="help" element={<Help />} />
            </Route>
          {/* </Route> */}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
