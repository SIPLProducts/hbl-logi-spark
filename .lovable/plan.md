## Plan

Add HTML `required` attributes to the From Date and To Date inputs on the Dispatch Orders screen so the browser enforces mandatory entry before submission.

### Changes
- `src/routes/dispatch-orders.tsx`
  - Add `required` to the `<input type="date">` for **From Date**.
  - Add `required` to the `<input type="date">` for **To Date**.

The labels already show a red asterisk, and `onExecute` already validates emptiness. This change adds native browser validation on top.