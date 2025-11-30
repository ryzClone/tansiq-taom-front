import { createContext, useContext, useState } from "react";
import "../styles/Notification.css";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [list, setList] = useState([]);

  const addNotification = (msg, type = "info") => {
    const id = Date.now();
    setList((prev) => [...prev, { id, msg, type }]);

    setTimeout(() => {
      setList((prev) => prev.filter((n) => n.id !== id));
    }, 1500);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      <div className="notif-container">
        {list.map((n) => (
          <div key={n.id} className={`notif ${n.type}`}>
            {n.msg}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
