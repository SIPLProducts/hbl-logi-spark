All Reports screens render through the single `ReportPlaceholder` component. In its `DateField` sub-component, the input currently uses `type="text"` with a placeholder mask. The fix is to switch the input to `type="date"` so the browser renders a native date picker.

**Scope**
- File: `src/components/report-placeholder.tsx`
- Change: `DateField` input `type="text"` → `type="date"`
- Remove the placeholder text (native date inputs ignore placeholders) and adjust padding/classes if needed.

**Before**
```tsx
<input type="text" placeholder="dd-mm-yyyy" className={INPUT + " pr-9"} />
<Calendar className="size-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
```

**After**
```tsx
<input type="date" className={INPUT + " pr-9"} />
<Calendar className="size-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
```

No other files are affected — all report routes import `ReportPlaceholder`.