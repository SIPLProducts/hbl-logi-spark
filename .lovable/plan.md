Match the SAP toggle's geometry exactly to the Outward pill (`PremiumRadio`).

The Outward pill uses `text-[12px] font-medium … pl-1.5 pr-3 py-1` with no explicit height (≈24px tall, content-sized width). The SAP toggle currently uses `p-1` wrapper + `px-3 h-7` per option (≈36px tall and visually wider).

Update both SAP toggles to use the same dimensions:

- `src/components/le-screen-shell.tsx` — `SapToggle` (line 642) and `SearchSapToggle` (line 713):
  - Wrapper: change `p-1` → `p-0` (remove outer padding so total height is driven by the buttons, matching PremiumRadio's lack of wrapper padding). Keep `rounded-full bg-accent/10 text-[12px]`.
  - Sliding thumb: change `top-1 bottom-1 left-1 w-[calc(50%-4px)]` → `top-0 bottom-0 left-0 w-[50%]` so the indicator still fills its half exactly.
  - Buttons: change `px-3 h-7 font-semibold` → `px-3 py-1 font-medium` (drop the fixed `h-7`, match PremiumRadio's `py-1` + `font-medium` + `text-[12px]` inherited from wrapper).
- `src/routes/dispatch.tsx` — `SapToggle` (line 391): apply the identical three changes.

No color, label, or behavioral changes. Result: SAP toggle height equals Outward pill height (~24px), and each button's width is content-sized like the Outward pill rather than padded by a wider chrome.