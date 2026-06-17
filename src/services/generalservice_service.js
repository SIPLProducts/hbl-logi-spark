const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
 
// Common helper to reduce repetitive fetch headers & JSON parsing
const request = async (url, method, data = null) => {
    const options = {
        method: method,
        headers: { "Content-Type": "application/json" }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const res = await fetch(`${BASE_URL}${url}`, options);
    return res.json();
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
    shipmentdetailsNonSapReports: (data) => request('api/external/LE/ShipmentDetails/Nonsap/Reports', 'POST', data)
};
 
// Default export combining everything, similar to your target template pattern
const backendNodejs = {
    ...sapExternalApi,
    ...reportsApi
};
 
export default backendNodejs;