export default function Button({ children, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 ${className}`}
    >
      {children}
    </button>
  );
}
