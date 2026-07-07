# Fix: Shipment Details Save — payload missing reference fields

## Problem

On Save, the backend returns success but no record is written. The user's payload shows the row has `ZMAPID: "102"` but every field that should come from the picked reference row is empty:

```
ZREFNO: "", ZLINE_NO: "", ZWORK_ORDER: "", ZLRNO: "", ZTRANSPORTER: "",
ZSO_NO: "", ZODN_NO: "", ZPIN_PLT: "", ZPIN_STP: "", MTART: (user-typed only)
```

Root cause is in `src/components/shipment-details-sap-create.tsx`:

1. `onChangeMapId(index, mapId)` (~line 396) only copies 5 fields from the matched `selectedItems` entry (`ZMAPID`, `ZREFNO`, `ZWORK_ORDER`, `ZLRNO`, `ZTRANSPORTER`, `ZLINE_NO`). It never copies `soNumber → ZSO_NO`, `odnNumber → ZODN_NO`, `plantCode → ZPIN_PLT`, `shippingPoint → ZPIN_STP`, or `materialType → MTART`. Those stay blank on the row and get sent as blanks.
2. `RefRow` matching in `selectedItems.find((item) => item.MAPID === mapId)` will silently no-op (leaving all reference fields "") if the exact MAPID isn't in `selectedItems` — e.g. when the SAP-fetched items already have a `ZMAPID` value that was pre-filled but the corresponding reference row was checked with a different MAPID string. Nothing warns the user.
3. `saveShipmentOutward` (~line 621) sends `finalPayload` as-is without back-filling reference fields from `selectedItems`, so any row where step 1 didn't fully populate goes out with blanks.

Backend then treats the row as invalid (missing primary-key fields like `ZREFNO`/`ZLINE_NO`) and returns a generic success while writing nothing.

## Fix (single file: `src/components/shipment-details-sap-create.tsx`)

### 1. Expand `onChangeMapId` to copy all reference-derived fields

```ts
const onChangeMapId = (index: number, mapId: string) => {
  const selectedObj = selectedItems.find((item) => item.MAPID === mapId);
  if (!selectedObj) {
    updateRow(index, { ZMAPID: mapId });
    return;
  }
  updateRow(index, {
    ZMAPID: selectedObj.MAPID,
    ZREFNO: selectedObj.referenceNumber,
    ZLINE_NO: selectedObj.lineNumber,
    ZWORK_ORDER: selectedObj.workOrderNumber,
    ZLRNO: selectedObj.lrNumber,
    ZTRANSPORTER: selectedObj.transporter,
    ZSO_NO: selectedObj.soNumber,
    ZODN_NO: selectedObj.odnNumber,
    ZPIN_PLT: selectedObj.plantCode,
    ZPIN_STP: selectedObj.shippingPoint,
    // Only overwrite MTART if the row hasn't set it yet, so a user-typed
    // material type isn't lost when they re-pick the Map ID.
    MTART: items[index]?.MTART || selectedObj.materialType,
  });
};
```

### 2. Back-fill reference fields in `saveShipmentOutward` before POST

Right after building `finalPayload` (line ~642), enrich each row from the matching `selectedItems` entry so blanks are filled even if the user never re-triggered `onChangeMapId`:

```ts
const refByMapId = new Map(selectedItems.map((r) => [r.MAPID, r]));
const finalPayload = selectedRows.map((row) => {
  const ref = refByMapId.get(row.ZMAPID);
  const merged = {
    ...row,
    ZREFNO:       row.ZREFNO       || ref?.referenceNumber  || "",
    ZLINE_NO:     row.ZLINE_NO     || ref?.lineNumber       || "",
    ZWORK_ORDER:  row.ZWORK_ORDER  || ref?.workOrderNumber  || "",
    ZLRNO:        row.ZLRNO        || ref?.lrNumber         || "",
    ZTRANSPORTER: row.ZTRANSPORTER || ref?.transporter      || "",
    ZSO_NO:       row.ZSO_NO       || ref?.soNumber         || "",
    ZODN_NO:      row.ZODN_NO      || ref?.odnNumber        || "",
    ZPIN_PLT:     row.ZPIN_PLT     || ref?.plantCode        || "",
    ZPIN_STP:     row.ZPIN_STP     || ref?.shippingPoint    || "",
    MTART:        row.MTART        || ref?.materialType     || "",
    ZINS_SCPOE: row.ZINS_SCPOE?.trim() ? row.ZINS_SCPOE : (zinsScope || ""),
    ZKM:        row.ZKM !== "" && row.ZKM != null ? row.ZKM : (zkm || ""),
    ZINCO:      row.ZINCO?.trim() ? row.ZINCO : (zinco || ""),
    VBELN:      row.VBELN?.trim() ? row.VBELN : (vbeln || ""),
    ZUSER: loggedInUser,
    ZUSER_CH: "",
  };
  return merged;
});
```

### 3. Pre-save guard for missing primary keys

Before sending, validate each row has the fields the backend requires so we fail loudly instead of getting a silent "success":

```ts
const missing = finalPayload.find(
  (r) => !r.ZREFNO || !r.ZMAPID || (isSap && !r.VBELN),
);
if (missing) {
  Swal.fire({
    icon: "warning",
    title: "Incomplete row",
    text: "Please pick a Map ID that matches a selected reference row so Ref No / Invoice No get populated.",
  });
  setLoading(false);
  return;
}
```

## Out of scope

- `LeScreenShell`, other routes, and the Non-SAP flow's non-reference fields (Incoterms/Scope/KM already handled) are unchanged.
- No backend/service file changes — the API contract is fine; we just need to send complete data.

## Verification

1. Open Shipment Details → With SAP → enter Ref No → tick reference row → GET Invoice → tick product row → Save.
2. Network tab: the request body's each row now has non-empty `ZREFNO`, `ZLINE_NO`, `ZWORK_ORDER`, `ZLRNO`, `ZTRANSPORTER`, `ZSO_NO`, `ZODN_NO`, `ZPIN_PLT`, `ZPIN_STP`.
3. Backend returns success AND the record is visible in Filter & Download results.
4. If user forgets to tick a reference row whose MAPID matches, the new guard shows a clear warning instead of a false success.
