/**
 * Reusable data table component with header, rows, and optional empty state.
 * Supports custom cell rendering via `columns[].render`.
 */
export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = 'No data available',
  className = '',
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-secondary">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
                           text-text-tertiary ${col.headerClassName || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-secondary">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-text-tertiary"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="hover:bg-surface-secondary/50 transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.cellClassName || ''}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row, rowIndex)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
