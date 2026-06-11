## Fix
Remove the empty `<div className="hidden lg:block" />` placeholder at the end of the Account-fields block in `src/components/freight-billing-sap-create.tsx`. It was added to fill a grid cell, but it leaves a visible blank slot after "Bill Submission To F&A" and pushes the file-upload row down. Removing it lets the next row (Freight Bill upload, etc.) flow naturally into the empty cell.

No other changes.