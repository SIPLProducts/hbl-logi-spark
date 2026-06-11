export function LeFooter() {
  return (
    <div className="px-6 py-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-hairline bg-surface/80 backdrop-blur">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
        <span className="status-dot" />
        <span className="font-mono font-semibold text-success uppercase tracking-wider text-[10px]">SAP S/4HANA · Connected</span>
      </div>
      <div className="font-mono">2026 © Sharviinfotech · All rights reserved</div>
    </div>
  );
}