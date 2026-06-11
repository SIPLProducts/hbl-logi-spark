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
    <div className="bg-surface rounded-xl border border-hairline shadow-soft overflow-hidden">
      {(title || toolbar) && (
        <div className="px-4 py-3 border-b border-hairline bg-surface-2/50 flex items-center justify-between gap-4">
          {title && (
            <h2 className="font-display text-[13px] font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}
      <div className="overflow-x-auto scrollbar-elegant">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground border-b border-hairline">
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
          <tbody className="divide-y divide-hairline/70 text-[12.5px]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground text-[12px]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-2/70 transition-colors">
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