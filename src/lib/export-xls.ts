export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number;
};

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Produces a SpreadsheetML 2003 (.xls) file that Excel opens cleanly.
export function exportRowsToXls<T>(filename: string, columns: ExportColumn<T>[], rows: T[]) {
  const head = columns
    .map((c) => `<Cell><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`)
    .join("");

  const body = rows
    .map((r) => {
      const cells = columns
        .map((c) => {
          const v = c.value(r);
          if (typeof v === "number" && Number.isFinite(v)) {
            return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
          }
          return `<Cell><Data ss:Type="String">${escapeXml(String(v ?? ""))}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Sheet1"><Table><Row>${head}</Row>${body}</Table></Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}