export default function Table({ columns, rows }) {
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col} className="border px-4 py-2 bg-gray-100">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {columns.map(col => <td key={col} className="border px-4 py-2">{row[col]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
