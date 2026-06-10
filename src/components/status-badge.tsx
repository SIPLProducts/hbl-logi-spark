const tones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  zinc: "bg-zinc-100 text-zinc-700 ring-zinc-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

const dotTones: Record<string, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  zinc: "bg-zinc-400",
  violet: "bg-violet-500",
};

export type Tone = keyof typeof tones;

export function StatusBadge({
  label,
  tone = "zinc",
  dot = true,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ring-1 " +
        tones[tone]
      }
    >
      {dot && <span className={"size-1.5 rounded-full " + dotTones[tone]} />}
      {label}
    </span>
  );
}

// Map common LE statuses to a tone
export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (
    [
      "delivered",
      "completed",
      "complete",
      "putaway complete",
      "unloaded",
      "packed",
      "goods issued",
      "shipped",
      "picked",
      "posted",
    ].includes(s)
  )
    return "green";
  if (
    [
      "in transit",
      "picking",
      "in progress",
      "loaded",
      "checked-in",
      "gate-in",
      "departed",
      "open",
    ].includes(s)
  )
    return "amber";
  if (["exception", "blocked", "cancelled", "short-ship", "shortage"].includes(s))
    return "red";
  if (["created", "planned", "queued", "expected", "pending"].includes(s)) return "zinc";
  if (["arrived"].includes(s)) return "blue";
  return "zinc";
}