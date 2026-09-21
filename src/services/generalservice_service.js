import { trackApiCall } from "../lib/api-loading";

const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

// Common helper to reduce repetitive fetch headers & JSON parsing
const requestRaw = async (url, method, data = null) => {
    const options = {
        method: method,
        headers: { "Content-Type": "application/json" }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const res = await fetch(`${BASE_URL}${url}`, options);
    if (res.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("userData");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("isLoggedIn");
            sessionStorage.removeItem("sessionActive");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login?session=expired";
            }
        }
    }
    return res.json();
};

// Every API call goes through here so the global loading indicator (<ApiLoader />) reflects it.
const request = (url, method, data = null) => trackApiCall(() => requestRaw(url, method, data));

export const getLocalDocumentUrl = ({ mode, screen, field, fileName, storedPath, row } = {}) => {
    let backendBase = import.meta.env.VITE_BACKEND_BASE_URL || "";
    if (!backendBase) {
        backendBase = typeof window !== "undefined" && window.location?.hostname
            ? `${window.location.protocol}//${window.location.hostname}:3001`
            : "http://localhost:3001";
    }
    // If backendBase points to localhost but the app is accessed via IP or remote domain
    if (typeof window !== "undefined" && window.location?.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        if (backendBase.includes("localhost") || backendBase.includes("127.0.0.1")) {
            backendBase = backendBase.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
        }
    }
    backendBase = backendBase.replace(/\/+$/, "");

    // 1. Direct row ZLOCALFILE_URLS if present
    if (row?.ZLOCALFILE_URLS?.[field]) {
        const rel = String(row.ZLOCALFILE_URLS[field]).replace(/^\/+/, "");
        return `${backendBase}/${rel}`;
    }

    // 2. Direct HTTP storedPath
    if (storedPath && typeof storedPath === "string") {
        if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
            return storedPath;
        }
        const match = storedPath.match(/[\\/]?(SAP|Without\s+Sap)[\\/](.+)$/i);
        if (match) {
            const relPath = match[0].replace(/\\/g, "/").replace(/^\/+/, "");
            const parts = relPath.split("/").map(p => encodeURIComponent(decodeURIComponent(p)));
            return `${backendBase}/pravah-files/${parts.join("/")}`;
        }
    }

    if (!fileName || fileName === "-" || fileName === "NA") return "";

    const cleanFileName = decodeURIComponent(fileName).trim();
    const modeFolder = String(mode || "").toLowerCase().includes("without") ? "Without Sap" : "SAP";
    const screenMap = {
        "TRANSIT INFO": "Transit_Info",
        "Transit_Info": "Transit_Info",
        "FREIGHT BILLING": "Freight_Billing",
        "Freight_Billing": "Freight_Billing",
        "TRANSIT DAMAGE INFO": "Transit_Damage_Info",
        "Transit_Damage_Info": "Transit_Damage_Info",
        "INSURANCE CLAIM STATUS": "Insurance_Claim",
        "Insurance_Claim": "Insurance_Claim",
    };
    const screenFolder = screenMap[screen] || screen;

    // Attach refNo / invNo query params if available to help backend resolution
    const refNo = row?.ZREFNO || row?.REFNO || row?.REF_NO;
    const invNo = row?.ZINV_NO || row?.INV_NO || row?.INVNO;
    const qp = [];
    if (refNo) qp.push(`refNo=${encodeURIComponent(refNo)}`);
    if (invNo) qp.push(`invNo=${encodeURIComponent(invNo)}`);
    const query = qp.length ? `?${qp.join("&")}` : "";

    return `${backendBase}/pravah-files/${encodeURIComponent(modeFolder)}/${encodeURIComponent(screenFolder)}/${encodeURIComponent(field)}/${encodeURIComponent(cleanFileName)}${query}`;
};

export const downloadDocument = async (url, title) => {
    if (!url) return;

    let fileName = "";
    if (title && typeof title === "string" && /\.[a-zA-Z0-9]+$/.test(title.trim())) {
        fileName = title.trim();
    } else {
        try {
            const rawName = url.split("?")[0].split("/").pop();
            if (rawName) {
                const decoded = decodeURIComponent(rawName);
                if (/\.[a-zA-Z0-9]+$/.test(decoded)) {
                    fileName = decoded;
                }
            }
        } catch (_e) {}
    }
    if (!fileName) {
        fileName = (title && typeof title === "string" ? title.trim() : "") || "document";
    }

    try {
        const response = await trackApiCall(() => fetch(url));
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.warn("Direct blob download failed, falling back to direct link download:", err);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};




// 2. Logistics Execution (LE) & SAP Integration APIs
export const sapExternalApi = {
    // Order Info
    OrderinfoOutward: (data) => request('api/external/LE/orderInfo/Outward/fetchInvoiceList', 'POST', data),
    OrderInfoOutwardSave: (data) => request('api/external/LE/orderInfo/Outward/withsap/Save', 'POST', data),
    OrderInfoNonSap: (data) => request('api/external/LE/orderInfo/Outward/withoutsap/Save', 'PUT', data),
    getpdb: () => request('api/external/LE/orderInfo/f4_getAllDetails', 'GET'),
    fetchzone: (data) => request('api/external/LE/orderInfo/Outward/withoutsap/fetchzone', 'PUT', data),
    custgroup: (data) => request('api/external/LE/orderInfo/Outward/withoutsap/custgroup', 'PUT', data),
    OrderInfoPhysicaldispatch: (data) => request('api/external/LE/orderInfo/Outward/Physicaldispatch', 'PUT', data),
    OrderInfoDeleteWithSap: (data) => request('api/external/LE/orderInfo/Outward/DeleteWithSap', 'POST', data),
    OrderInfoDeleteWithoutSap: (data) => request('api/external/LE/orderInfo/Outward/DeleteWithoutSap', 'PUT', data),
    PlantBasedDivison: (data) => request('api/external/LE/orderInfo/Outward/withoutsap/PlantBasedDivison', 'PUT', data),
    // Shipment Details
    shipmentdetailsfetch: (data) => request('api/external/LE/ShipmentDetails/Outward/fetchInvoiceList', 'POST', data),
    ShipmentOutwardSave: (data) => request('api/external/LE/ShipmentDetails/Outward/Save', 'POST', data),
    getTypeofmaterial: () => request('api/external/LE/ShipmentDetails/Nonsap/f4_Typeofmaterial', 'GET'),
    Incoterms: (data) => request('api/external/LE/ShipmentDetails/Nonsap/f4_Incoterms', 'PUT', data),
    shipmentdetailsNonSapSave: (data) => request('api/external/LE/ShipmentDetails/Nonsap/Save', 'POST', data),
    Shipmentchangewithsap: (data) => request('api/external/LE/ShipmentDetails/Outward/ChangeWithSap', 'POST', data),
    Shipmentchangewithoutsap: (data) => request('api/external/LE/ShipmentDetails/Outward/ChangeWithoutSap', 'POST', data),
    ShipmentDeleteWithSap: (data) => request('api/external/LE/ShipmentDetails/Outward/ShipmentDeleteWithSap', 'POST', data),
    ShipmentDeleteWithoutSap: (data) => request('api/external/LE/ShipmentDetails/Outward/ShipmentDeleteWithoutSap', 'PUT', data),
    // Segment Info
    SegmentInfoOutwardFetch: (data) => request('api/external/LE/segmentInfo/Outward/fetchInvoiceList', 'POST', data),
    SegmentInfoOutwardwithoutSapFetch: (data) => request('api/external/LE/segmentInfo/Outward/WithoutSap/fetchInvoiceList', 'POST', data),
    SegmentInfoOutwardSave: (data) => request('api/external/LE/segmentInfo/Outward/withsap/Save', 'POST', data),
    SegmentInfoNonSap: (data) => request('api/external/LE/segmentInfo/Outward/withoutsap/Save', 'PUT', data),
    SegmentInfoChangeWithSap: (data) => request('api/external/LE/segmentInfo/Outward/ChangeWithSap', 'POST', data),
    SegmentInfoChangeWithoutSap: (data) => request('api/external/LE/segmentInfo/Outward/ChangeWithoutSap', 'PUT', data),
    SegmentInfoDeleteWithSap: (data) => request('api/external/LE/segmentInfo/Outward/DeleteWithSap', 'POST', data),
    SegmentInfoDeleteWithoutSap: (data) => request('api/external/LE/segmentInfo/Outward/DeleteWithoutSap', 'PUT', data),
    getssc: () => request('api/external/LE/segmentInfo/f4_getAllDetails', 'GET'),
    fetchTAT: (data) => request('api/external/LE/segmentInfo/Outward/withSap/TAT_Type', 'PUT', data),
    fetchNonSapTAT: (data) => request('api/external/LE/segmentInfo/Outward/NonSap/TAT_Type', 'PUT', data),
    fetchzoneTat: (data) => request('api/external/LE/segmentInfo/Outward/withoutsap/fetchzone', 'PUT', data),

    // Transit Info
    TransitInfoSave: (data) => request('api/external/LE/TransitInfo/Outward/WithSap/Save', 'POST', data),
    TransitInfoNonSap: (data) => request('api/external/LE/TransitInfo/NonSap/Save', 'PUT', data),
    TransitInfoDeleteWithSap: (data) => request('api/external/LE/TransitInfo/Outward/WithSap/Delete', 'POST', data),
    TransitInfoDeleteWithOutSap: (data) => request('api/external/LE/TransitInfo/Outward/WithoutSap/Delete', 'PUT', data),
    TransitInfoChangeWithSap: (data) => request('api/external/LE/TransitInfo/Outward/WithSap/Change', 'POST', data),
    TransitInfoChangeWithoutSap: (data) => request('api/external/LE/TransitInfo/Outward/WithoutSap/Change', 'PUT', data),

    // Freight Billing
    FreightBillingSave: (data) => request('api/external/LE/FreightBilling/Outward/WithSap/Save', 'POST', data),
    FreightBillingNonSap: (data) => request('api/external/LE/FreightBilling/Outward/NonSap/Create', 'PUT', data),
    FreightBillingChangeWithSap: (data) => request('api/external/LE/FreightBilling/Outward/ChangeWithSap', 'POST', data),
    FreightBillingChangeWithoutSap: (data) => request('api/external/LE/FreightBilling/Outward/ChangeWithoutSap', 'PUT', data),
    FreightBillingDeleteWithSap: (data) => request('api/external/LE/FreightBilling/Outward/WithSap/Delete', 'POST', data),
    FreightBillingDeleteWithOutSap: (data) => request('api/external/LE/FreightBilling/Outward/NonSap/Delete', 'PUT', data),

    // Vehicle Info
    VehicleInfofetch: (data) => request('api/external/LE/Vehicleinfo/Outward/fetchInvoiceList', 'POST', data),
    VehicleInfosave: (data) => request('api/external/LE/Vehicleinfo/Outward/Save', 'POST', data),
    VehicleInfoNonSap: (data) => request('api/external/LE/Vehicleinfo/NonSap/Save', 'PUT', data),
    VehicleInfoMapid: (data) => request('api/external/LE/Vehicleinfo/Outward/WithSapMapid', 'POST', data),
    VehicleInfoMapidForNonsap: (data) => request('api/external/LE/Vehicleinfo/Outward/WithoutSapMapid', 'PUT', data),
    VehicleInfoChangeWithSap: (data) => request('api/external/LE/Vehicleinfo/Outward/ChangeWithSap', 'POST', data),
    VehicleInfoChangeWithoutSap: (data) => request('api/external/LE/Vehicleinfo/Outward/ChangeWithoutSap', 'PUT', data),
    VehicleInfoDeleteWithSap: (data) => request('api/external/LE/Vehicleinfo/Outward/DeleteWithSap', 'POST', data),
    VehicleInfoDeleteWithoutSap: (data) => request('api/external/LE/Vehicleinfo/Outward/DeleteWithoutSap', 'PUT', data),
    DCReferenceNo: (data) => request('api/external/LE/Vehicleinfo/NonSap/DCNO', 'PUT', data),

    // Invoice Load Details
    Invoiceloaddetailsfetch: (data) => request('api/external/LE/InvoiceloadDetails/Outward/fetchInvoiceList', 'POST', data),
    sapget: (data) => request('api/external/LE/InvoiceloadDetails/Outward/sapget', 'POST', data),
    InvoiceloaddetailsSave: (data) => request('api/external/LE/InvoiceloadDetails/Outward/save', 'POST', data),
    InvoiceloaddetailsNonSap: (data) => request('api/external/LE/InvoiceloadDetails/NonSap/Save', 'POST', data),
    gettypeofvehicle: () => request('api/external/LE/InvoiceloadDetails/f4_getAllDetails', 'GET'),
    InvoiceloaddetailsDeleteWithsap: (data) => request('api/external/LE/InvoiceloadDetails/Outward/DeleteWithsap', 'POST', data),
    InvoiceloaddetailsDeleteWithoutsap: (data) => request('api/external/LE/InvoiceloadDetails/Outward/DeleteWithoutsap', 'PUT', data),

    // Insurance Claim Tracking
    InsuranceClaimTrackingfetch: (data) => request('api/external/LE/InsuranceClaimTracking/Outward/fetchinvoicelist', 'POST', data),
    InsuranceClaimTrackingSave: (data) => request('api/external/LE/InsuranceClaimTracking/Outward/save', 'POST', data),
    fetchinvoicelistnonsap: (data) => request('api/external/LE/InsuranceClaimTracking/NonSap/fetchinvoicelistnonsap', 'PUT', data),
    Nonsapsave: (data) => request('api/external/LE/InsuranceClaimTracking/NonSap/Nonsapsave', 'PUT', data),
    InsuranceClaimTrackingDeleteWithSap: (data) => request('api/external/LE/InsuranceClaimTracking/Outward/DeleteWithSap', 'POST', data),
    InsuranceClaimTrackingDeleteWithoutSap: (data) => request('api/external/LE/InsuranceClaimTracking/NonSap/DeleteWithoutSap', 'PUT', data),
    InsuranceClaimTrackingChangeWithSap: (data) => request('api/external/LE/InsuranceClaimTracking/Outward/ChangeWithSap', 'POST', data),
    InsuranceClaimTrackingChangeWithoutSap: (data) => request('api/external/LE/InsuranceClaimTracking/Outward/ChangeWithoutSap', 'PUT', data),

    // Transit Damage Info
    TransitDamageInfofetch: (data) => request('api/external/LE/TransitDamageInfo/Outward/fetchinvoicelist', 'POST', data),
    TransitDamageInfoSave: (data) => request('api/external/LE/TransitDamageInfo/Outward/Save', 'POST', data),
    TransitDamageinfofetchNonsap: (data) => request('api/external/LE/TransitDamageInfo/NonSap/fetchinvoicelistnonsap', 'PUT', data),
    withoutsapSave: (data) => request('api/external/LE/TransitDamageInfo/NonSap/withoutsapSave', 'PUT', data),
    TransitDamageInfoDeleteWithSap: (data) => request('api/external/LE/TransitDamageInfo/Outward/DeleteWithSap', 'POST', data),
    TransitDamageInfoDeleteWithoutSap: (data) => request('api/external/LE/TransitDamageInfo/NonSap/DeleteWithoutSap', 'PUT', data),
    TransitDamageInfoChangeWithSap: (data) => request('api/external/LE/TransitDamageInfo/Outward/ChangeWithSap', 'POST', data),
    TransitDamageInfoChangeWithoutSap: (data) => request('api/external/LE/TransitDamageInfo/Outward/Change/WithoutSap', 'PUT', data),

    // Dispatch Management
    DispatchSave: (data) => request('api/external/LE/Dispatch/Outward/withsap/Save', 'POST', data),
    DispatchNonSapSave: (data) => request('api/external/LE/Dispatch/Outward/withoutsap/Save', 'PUT', data),
    fetchVendorCode: () => request('api/external/LE/Dispatch/Outward/F4Vendorcode/fetch', 'GET'),
    fetchReferencenumber: (data) => request('api/external/LE/Dispatch/Outward/ReferenceNumber/fetch', 'POST', data),
    fetchReferencenumberWithoutSap: (data) => request('api/external/LE/Dispatch/Outward/ReferenceNumber/WithoutSap/fetch', 'PUT', data),
    fetchReferencenumberEdit: (data) => request('api/external/LE/Dispatch/Outward/ReferenceNumber/edit', 'POST', data),

    // Global Fields & Lookups
    GlobalReferenceNoFetch: (data) => request('api/external/LE/orderinfo/GlobalReferenceNoFetch', 'POST', data),
    GlobalReferenceNoFetchwithoutsap: (data) => request('api/external/LE/orderinfo/GlobalReferenceNoFetchwithoutsap', 'PUT', data),
    global_Fields_SearchOption: (data) => request('api/external/LE/orderinfo/global_Fields_SearchOption', 'POST', data),
    global_Fields_SearchOption_WithoutSap: (data) => request('api/external/LE/orderinfo/global_Fields_SearchOption_WithoutSap', 'PUT', data),
    fetchDispatchFiltered: (data) => request('api/external/LE/orderinfo/Filter_Creation', 'POST', data),
    fetchDispatchFilteredNonSap: (data) => request('api/external/LE/Dispatch/Outward/Filter_Creation_NonSap', 'PUT', data),
    fetchOrderInfoFiltered: (data) => request('api/external/LE/orderinfo/Outward/Filter_Creation', 'POST', data),
    fetchGlobalFilteredNonSap: (data) => request('api/external/LE/Global/Outward/Filter_Creation_NonSap', 'PUT', data),
    OutwardCountGlobalWithSap: (data) => request('api/external/LE/Outward/GlobalScreen/CountWithSap', 'POST', data),
    GlobalUserAuth: (data) => request('api/external/LE/GlobalUserAuth', 'POST', data),
    UserCreationDisplayTable: () => request('api/external/LE/UserCreation/DisplayTable', 'GET'),
    UserCreationDelete: (data) => request('api/external/LE/UserCreationDelete', 'POST', data),
    forgotPassword: (data) => request('api/external/LE/send-credentials', 'PUT', data),
    GlobalFileView: (data) => request('api/external/LE/GlobalFileView', 'PUT', data),

    // Feedback
    FeedbackCreationwithsap: (data) => request('api/external/LE/ServiceLevel/Outword/withsap/FeedbackCreation', 'POST', data),
    FeedbackCreationwithoutsap: (data) => request('api/external/LE/ServiceLevel/Outword/WithoutSap/FeedbackCreation', 'PUT', data),
    FeedBackInvoiceDetailsfetchwithsap: (data) => request('api/external/LE/ServiceLevel/Outward/WithSap/InvoiceDetailsfetch', 'POST', data),
    FeedBackInvoiceDetailsfetchwithoutsap: (data) => request('api/external/LE/ServiceLevel/Outward/WithoutSap/InvoiceDetailsfetch', 'PUT', data)
};

// 3. Analytic Reports APIs
export const reportsApi = {
    FetchTransitReport: (data) => request('api/external/LE/Reports/FetchTransitReport', 'POST', data),
    FetchPendingPodReport: (data) => request('api/external/LE/Reports/FetchPendingPods', 'POST', data),
    FetchLoadingFactorandCost: (data) => request('api/external/LE/Reports/FetchLoadingFactorandCost', 'POST', data),
    FetchFreightBills: (data) => request('api/external/LE/Reports/FetchFreightBills', 'POST', data),
    FetchBusinessShareMatrix: (data) => request('api/external/LE/Reports/FetchBusinessShareMatrix', 'POST', data),
    FetchDamageList: (data) => request('api/external/LE/Reports/FetchDamageList', 'POST', data),
    FetchInsuranceReports: (data) => request('api/external/LE/Reports/FetchInsuranceReportsDetails', 'POST', data),
    FetchServiceLevelReports: (data) => request('api/external/LE/Reports/FetchServiceLevelDetails', 'POST', data),
    FetchDispatchOrderFlowData: (data) => request('api/external/LE/DispatchOrderFlow/FetchData', 'POST', data),
    FetchDispatchOrderPendingCounts: () => request('api/external/LE/DispatchOrderFlow/PendingCounts', 'GET'),
    shipmentdetailsNonSapReports: (data) => request('api/external/LE/ShipmentDetails/Nonsap/Reports', 'POST', data),
    FetchGateInOutInvoiceData: (data) => request('api/external/LE/GateInOut/InvoiceGet', 'POST', data),
    SaveGateInOutWithSap: (data) => request('api/external/LE/GateInOut/WithSap/Save', 'POST', data),
    SearchGateInOutWithSap: (data) => request('api/external/LE/GateInOut/WithSap/Search', 'POST', data),
    DeleteGateInOutWithSap: (data) => request('api/external/LE/GateInOut/WithSap/Delete', 'POST', data),
    FilterRecordsGateInOutWithSap: (data) => request('api/external/LE/GateInOut/WithSap/FilterRecords', 'POST', data),
    ChangeGateInOutWithSap: (data) => request('api/external/LE/GateInOut/WithSap/Change', 'POST', data),
    FetchGateInOutInvoiceDataWithoutSap: (data) => request('api/external/LE/GateInOut/WithoutSap/InvoiceGet', 'PUT', data),
    SaveGateInOutWithoutSap: (data) => request('api/external/LE/GateInOut/WithoutSap/Save', 'PUT', data),
    SearchGateInOutWithoutSap: (data) => request('api/external/LE/GateInOut/WithoutSap/Search', 'PUT', data),
    DeleteGateInOutWithoutSap: (data) => request('api/external/LE/GateInOut/WithoutSap/Delete', 'PUT', data),
    FilterRecordsGateInOutWithoutSap: (data) => request('api/external/LE/GateInOut/WithoutSap/FilterRecords', 'PUT', data),
    ChangeGateInOutWithoutSap: (data) => request('api/external/LE/GateInOut/WithoutSap/Change', 'PUT', data)


};

// Default export combining everything, similar to your target template pattern
const backendNodejs = {
    ...sapExternalApi,
    ...reportsApi
};

export default backendNodejs;