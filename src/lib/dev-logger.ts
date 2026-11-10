// Development-only console logs for every API call and every checkbox click, on all screens.
// Nothing is logged on the live site: production builds (import.meta.env.DEV = false) skip all of it.
// A log can never affect the screen: every failure inside the logging itself is ignored.

const LOG_STYLE = {
  success: "color:#15803d;font-weight:600",
  failure: "color:#b91c1c;font-weight:600",
  checkbox: "color:#1d4ed8;font-weight:600",
};

// Longest text shown in a log; file contents (base64) are replaced with a short note.
const MAX_TEXT_LENGTH = 300;

// Fields whose values must never appear in a log (passwords, tokens...).
const SENSITIVE_FIELD = /password|passwd|pwd|pswd|token|secret|authorization|cookie|^pass$|(^|_)otp$/i;

function currentScreen(): string {
  return typeof window !== "undefined" ? window.location.pathname : "";
}

/** Copy of the data that is safe and easy to read: sensitive values hidden, long texts shortened. */
function readableData(data: unknown): unknown {
  if (typeof data === "string") {
    return data.length > MAX_TEXT_LENGTH ? `[long text, ${data.length} characters]` : data;
  }
  if (Array.isArray(data)) {
    return data.map(readableData);
  }
  if (data && typeof data === "object") {
    const copy: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(data)) {
      copy[field] = SENSITIVE_FIELD.test(field) ? "[hidden]" : readableData(value);
    }
    return copy;
  }
  return data;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Removes the server address, so the log shows only the API path. */
function apiPath(url: string): string {
  const baseUrl = String(import.meta.env.VITE_BACKEND_BASE_URL || "");
  return baseUrl && url.startsWith(baseUrl) ? url.slice(baseUrl.length) : url;
}

function printApiLog(details: {
  method: string;
  url: string;
  result: string;
  failed: boolean;
  startedAt: number;
  payload?: unknown;
  response?: unknown;
}) {
  const seconds = ((Date.now() - details.startedAt) / 1000).toFixed(2);
  console.groupCollapsed(
    `%c[API] ${details.method} ${apiPath(details.url)} | ${details.result} | ${seconds}s`,
    details.failed ? LOG_STYLE.failure : LOG_STYLE.success,
  );
  console.log("Screen:", currentScreen());
  console.log("Payload:", details.payload === undefined ? "(none)" : readableData(details.payload));
  console.log("Response:", readableData(details.response));
  console.groupEnd();
}

async function logApiResponse(
  response: Response,
  details: { method: string; url: string; startedAt: number; payload?: unknown },
) {
  try {
    const contentType = response.headers.get("content-type") || "";
    const isReadable = contentType.includes("json") || contentType.includes("text");
    const responseData = isReadable
      ? parseJson(await response.clone().text())
      : `[file, type: ${contentType || "unknown"}]`;
    printApiLog({
      ...details,
      result: `${response.status} ${response.statusText}`.trim(),
      failed: !response.ok,
      response: responseData,
    });
  } catch {
    // Logging must never affect the screen
  }
}

/** Same as fetch(); while developing it also prints the call in the browser console. */
export function fetchWithLog(url: string, options?: RequestInit): Promise<Response> {
  if (!import.meta.env.DEV) return fetch(url, options);

  const details = {
    method: options?.method || "GET",
    url,
    startedAt: Date.now(),
    payload: typeof options?.body === "string" ? parseJson(options.body) : undefined,
  };

  return fetch(url, options).then(
    (response) => {
      void logApiResponse(response, details);
      return response;
    },
    (error) => {
      try {
        printApiLog({ ...details, result: "FAILED (no response)", failed: true, response: String(error) });
      } catch {
        // Logging must never affect the screen
      }
      throw error;
    },
  );
}

/** The checkbox's name: its own label, otherwise its table column heading. */
function checkboxName(checkbox: Element): string {
  const ownLabel =
    checkbox.getAttribute("aria-label") ||
    checkbox.closest("label")?.textContent ||
    (checkbox.id ? document.querySelector(`label[for="${CSS.escape(checkbox.id)}"]`)?.textContent : "") ||
    checkbox.getAttribute("name");
  if (ownLabel?.trim()) return ownLabel.trim();

  const cell = checkbox.closest("td, th") as HTMLTableCellElement | null;
  const heading = cell?.closest("table")?.querySelector("thead tr")?.children[cell.cellIndex]?.textContent;
  return heading?.trim() || "(no label)";
}

/** For a checkbox inside a table: the first few values of its row, to identify the record. */
function checkboxRow(checkbox: Element): string {
  const row = checkbox.closest("tbody tr");
  if (!row) return "";
  return Array.from(row.children)
    .map((cell) => (cell.textContent || "").trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" | ");
}

function isChecked(checkbox: Element): boolean {
  return checkbox instanceof HTMLInputElement
    ? checkbox.checked
    : checkbox.getAttribute("aria-checked") === "true";
}

function logCheckboxClick(event: Event) {
  try {
    const target = event.target as Element | null;
    const checkbox = target?.closest?.('input[type="checkbox"], [role="checkbox"], [role="switch"]');
    if (!checkbox) return;

    // Read the name now (the screen may redraw after the click); read the result once the click is handled.
    const name = checkboxName(checkbox);
    const row = checkboxRow(checkbox);
    const screen = currentScreen();
    setTimeout(() => {
      const state = isChecked(checkbox) ? "TICKED" : "UNTICKED";
      console.log(
        `%c[CHECKBOX] ${state} "${name}" | Screen: ${screen}${row ? ` | Row: ${row}` : ""}`,
        LOG_STYLE.checkbox,
      );
    }, 0);
  } catch {
    // Logging must never affect the screen
  }
}

// One listener for the whole application, so no screen needs its own checkbox log.
if (import.meta.env.DEV && typeof document !== "undefined") {
  const page = window as unknown as { checkboxLoggerAdded?: boolean };
  if (!page.checkboxLoggerAdded) {
    page.checkboxLoggerAdded = true;
    document.addEventListener("click", logCheckboxClick, true);
  }
}
