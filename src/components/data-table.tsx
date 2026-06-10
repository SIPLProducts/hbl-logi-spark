import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string | number }>({
  title,
  columns,
  rows,
  toolbar,
  emptyMessage = "No records.",
}: {
  title?: string;
  columns: Column<T>[];
  rows: T[];
  toolbar?: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div className="bg-white rounded-sm ring-1 ring-zinc-200 overflow-hidden">
      {(title || toolbar) && (
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-zinc-900">
              {title}
            </h2>
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/60 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={
                    "px-4 py-3 " +
                    (c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                      ? "text-center"
                      : "") +
                    (c.className ?? "")
                  }
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-[12.5px]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-zinc-400 text-[12px]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/60 transition-colors">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={
                        "px-4 py-3 align-middle " +
                        (c.align === "right"
                          ? "text-right"
                          : c.align === "center"
                          ? "text-center"
                          : "")
                      }
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}