import React, { useEffect, useMemo, useState, useRef } from "react";
import { createClient } from '@supabase/supabase-js'; // Yeh import karo

const supabaseUrl = 'https://oxnmkgmuerxtzcdhsbuc.supabase.co';
const supabaseKey = 'sb_publishable_T_-uBi1pVO3pB4Oi0a5L1Q_2XOftjCI';
const supabase = createClient(supabaseUrl, supabaseKey);
import * as XLSX from "xlsx";
import "./App.css";

const COMPANY = {
  name: "Delhi Hyderabad Road Lines",
  address:
    "1017, 10th Floor, Shivalik Shilp, Iscon Cross Road, S.G Highway, Ahmedabad",
  mobile: "9327791999 / 9327891999",
  gst: "24ACZPL1421F1ZO",
  state: "Gujarat",
  code: "24",
  email: "cdpr.dhr@gmail.com",
};

const emptyCustomer = {
  name: "",
  partyType: "BOTH",
  gst: "",
  address: "",
  state: "",
  mobile: "",
  email: "",
};

const createEmptyAccount = () => ({

  date: new Date().toISOString().slice(0, 10),

  type: "RECEIPT",

  partyName: "",

  amount: "",

  paymentMode: "BANK",

  referenceNo: "",

  billNo: "",
  billIds: [],
  billAllocations: {},
  billTds: {},
  billDeductions: {},
  billNetAmounts: {},
  allocationType: "ON ACCOUNT",

  tdsType: "NO TDS",
  tdsName: "",
  tanNumber: "",
  tdsAmount: "",

  category: "OTHER",

  remarks: "",

});

const emptyVehicle = {
  vehicleNo: "",
  ownerName: "",
  vehicleType: "",
  capacity: "",
  driverName: "",
  driverMobile: "",
  rcNo: "",
  insuranceExpiry: "",
  fitnessExpiry: "",
  permitExpiry: "",
  pucExpiry: "",
  status: "Active",
};

const createEmptyBilty = () => ({
  bilty: "",
  date: new Date().toISOString().slice(0, 10),

  consignorId: "",
  consignor: "",
  consignorAddress: "",
  consignorGST: "",

  consigneeId: "",
  consignee: "",
  consigneeAddress: "",
  consigneeGST: "",

  pickup: "",
  delivery: "",

  material: "",
  actualWeight: "",
  chargeWeight: "",

  freight: "",
  advance: "",

  vehicleId: "",
  vehicle: "",
  vehicleType: "",
  driver: "",
  driverMobile: "",

  loadingDate: "",
  expectedDelivery: "",
  status: "Booked",
  ewayBillNo: "",
  ewayBillExpiry: "",
    ewayBills: [],  // [{no: "", expiry: ""}, ...]

  materialValue: "",
  remarks: "",
});

const createEmptyTrip = () => ({
  tripNo: "",
  tripDate: new Date().toISOString().slice(0, 10),

  biltyId: "",
  biltyNo: "",

  vehicleId: "",
  vehicleNo: "",
  vehicleType: "",
  driverName: "",
  driverMobile: "",

  brokerName: "",

  from: "",
  to: "",

  bookingFreight: 0,
    // ... existing fields ...
  pendingBilties: [],
  selectedBilties: [],

  lorryFreight: "",
  advance: "",

  status: "DISPATCHED",

  receivedDate: "",

  lorryHireBalance: "",

  damageAddition: "",
  damageDeduction: "",
  haltingAddition: "",
  haltingDeduction: "",
  otherAddition: "",
  otherDeduction: "",

  claimAmount: "",
  claimReason: "",

  remarks: "",
ewayBillNo: "",          // E-Way Bill Number
  ewayBillExpiry: "",      // E-Way Bill Expiry Date
  materialValue: "",       // Material Value (₹)

});

function getStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDate(date) {
  if (!date) return "-";

  const parts = String(date).split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return date;
}

function getNextNumber(items, field, prefix) {
  let max = 0;

  items.forEach((item) => {
    const value = String(item[field] || "");
    const match = value.match(new RegExp(`${prefix}-(\\d+)`));

    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  });

  return `${prefix}-${String(max + 1).padStart(5, "0")}`;
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [userRole, setUserRole] = useState("STAFF");
    // =========================================================
  // LOGIN STATE
  // =========================================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ===== LOGIN STATE के आसपास या PENDING BILL GENERATE STATE के पास =====
const [showCamera, setShowCamera] = useState(false);
const [cameraSide, setCameraSide] = useState('front');
const webcamRef = useRef(null);

  // ===== LOGIN STATE के बाद ये डालो =====
const [showResetPassword, setShowResetPassword] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
          // 🆕 NAYA — Password Recovery Event Handle
    if (event === 'PASSWORD_RECOVERY') {
      // Reset password modal dikhao ya page change karo
      setShowResetPassword(true);  // ← yeh state variable banana hoga
      // Ya direct navigate('/reset-password')
    }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const [reportType, setReportType] = useState("BILTY");
const [reportSearch, setReportSearch] = useState("");
const [reportFromDate, setReportFromDate] = useState("");
const [reportToDate, setReportToDate] = useState("");
const [reportCustomer, setReportCustomer] = useState("");
const [reportBroker, setReportBroker] = useState("");
const [reportPeriod, setReportPeriod] = useState("DAY");
  // ===== PENDING BILL GENERATE STATE =====
  const [showBillGenerateModal, setShowBillGenerateModal] = useState(false);
  const [pendingBillData, setPendingBillData] = useState({
    partyName: "",
    partyGST: "",
    partyAddress: "",
    biltyNo: "",
    biltyId: null,
    totalFreight: 0,
    received: 0,
    pending: 0,
    items: []
  });

// =========================================================
  // DAILY TRACKING STATE
  // =========================================================
  const [trackingVehicles, setTrackingVehicles] = useState([]);
  const [trackingStatusUpdate, setTrackingStatusUpdate] = useState({});
  const [dailyTrackingSearch, setDailyTrackingSearch] = useState("");   // ← NAYA NAAM
  const [trackingFilter, setTrackingFilter] = useState("ALL"); // ALL, IN TRANSIT, DELIVERED

  const [customers, setCustomers] = useState([]);
const [vehicles, setVehicles] = useState([]);
const [bilties, setBilties] = useState([]);
const [trips, setTrips] = useState([]);
const [pods, setPods] = useState([]);
const [bills, setBills] = useState([]);
const [accounts, setAccounts] = useState([]);

  // =========================================================
  // CUSTOMER VISITS STATE
  // =========================================================
  const [customerVisits, setCustomerVisits] = useState([]);
  const [visitForm, setVisitForm] = useState({
    id: null,
    visit_date: new Date().toISOString().slice(0, 10),
    customer_type: "NEW CUSTOMER",
    company_name: "",
    mobile: "",
    email: "",
    address: "",
    remarks: "",
    persons: [{ name: "", designation: "", mobile: "", email: "" }]
  });
  const [editingVisit, setEditingVisit] = useState(null);
  const [visitSearch, setVisitSearch] = useState("");
  const [visitTypeFilter, setVisitTypeFilter] = useState("ALL");
  const [visitFromDate, setVisitFromDate] = useState("");
  const [visitToDate, setVisitToDate] = useState("");
  const [visitReportPeriod, setVisitReportPeriod] = useState("DAY");


    const createEmptyBill = () => ({
    id: null,
    billNo: "",
    date: new Date().toISOString().slice(0, 10),
    partyName: "",
    partyGST: "",
    partyAddress: "",
    billType: "TAX INVOICE",
    vchNo: "",
    biltyNo: "",
    deliveryNote: "",
    paymentTerms: "",
    referenceNo: "",
    destination: "",
    termsOfDelivery: "",
    items: [],
    subtotal: 0,
    cgst: 0,
    sgst: 0,
    total: 0,
    igstRate: 5,
    remarks: "",
    createdAt: new Date().toISOString()
  });

    const createEmptyBillItem = () => ({
    id: Date.now(),
    description: "",
    subDescription: "",      // NAYA - for "Ballarpur to Kolkata" type
    hsn: "996519",
    date: new Date().toISOString().slice(0, 10),
    cnNo: "",                // NAYA - C.N. No.
    lorryNo: "",             // NAYA - Lorry No.
    quantity: 1,
    actualWeight: "",        // NAYA
    chargeWeight: "",        // NAYA
    rate: 0,
    amount: 0,
    type: "DEBIT",
    vchType: "SALES",
    vchNo: ""
  });

  const [billForm, setBillForm] = useState(createEmptyBill());
  const [editingBill, setEditingBill] = useState(null);
  const [billSearch, setBillSearch] = useState("");
  const [printBill, setPrintBill] = useState(null);

  // =========================================================
// POD / DELIVERY MANAGEMENT - STATES
// =========================================================

const createEmptyPOD = () => ({
  id: null,

  tripId: "",
  tripNo: "",
  biltyNo: "",

  vehicleNo: "",
  vehicleType: "",
  driverName: "",
  driverMobile: "",

  consignor: "",
  consignee: "",

  from: "",
  to: "",

  dispatchDate: "",
  deliveryDate: "",

  podNo: "",

  status: "IN TRANSIT",

  receivedBy: "",
  receiverMobile: "",

  shortageAmount: "",
  damageAmount: "",
  claimAmount: "",

  remarks: "",
  documentName: "",
  documentType: "",
  documentData: "",
  documentNameBack: "",
  documentTypeBack: "",
  documentDataBack: "",
});



const [podForm, setPodForm] = useState(
  createEmptyPOD()
);

const [editingPOD, setEditingPOD] = useState(null);

const [podSearch, setPodSearch] = useState("");

const [printPOD, setPrintPOD] = useState(null);



const [printMoneyReceipt, setPrintMoneyReceipt] = useState(null);

const [accountForm, setAccountForm] = useState(
  createEmptyAccount()
);

const [editingAccount, setEditingAccount] =
  useState(null);

const [accountSearch, setAccountSearch] =
  useState("");

const [ledgerParty, setLedgerParty] = useState("");
const [
  customerLedgerParty,
  setCustomerLedgerParty
] = useState("");

  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [biltyForm, setBiltyForm] = useState(createEmptyBilty());
  const [tripForm, setTripForm] = useState(createEmptyTrip());

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingBilty, setEditingBilty] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);

  const [biltyMode, setBiltyMode] = useState("automatic");

  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [biltySearch, setBiltySearch] = useState("");
  const [tripSearch, setTripSearch] = useState("");

  const [printBilty, setPrintBilty] = useState(null);
  const [printTrip, setPrintTrip] = useState(null);

  // =========================================================
  // LORRY HIRE BALANCE (LHB) STATE
  // =========================================================
  const [lhbSearch, setLhbSearch] = useState("");
  const [lhbTrip, setLhbTrip] = useState(null);
  const [lhbPayTo, setLhbPayTo] = useState("BROKER");
  const [lhbHalting, setLhbHalting] = useState(0);
  const [lhbDamage, setLhbDamage] = useState(0);
  const [lhbCash, setLhbCash] = useState(0);
  const [lhbBank, setLhbBank] = useState(0);
  const [lhbOther, setLhbOther] = useState(0);
  const [lhbRemarks, setLhbRemarks] = useState("");

  const lhbCurrentTotal = () => {
  if (!lhbTrip) return 0;
  const hire = Number(lhbTrip.lorryFreight || 0);
  const advance = Number(lhbTrip.advance || 0);
  const additions = Number(lhbHalting || 0);
  const deductions = Number(lhbDamage || 0);
  return (hire + additions - deductions) - advance;
};

const lhbPaidTotal = () => {
  return Number(lhbCash || 0) + Number(lhbBank || 0) + Number(lhbOther || 0);
};

const lhbPending = () => {
  return lhbCurrentTotal() - lhbPaidTotal();
};
  
 // =========================================================
  // LOAD ALL DATA FUNCTION
  // =========================================================

  const loadAllData = async () => {
    try {
      let { data: customersData } = await supabase.from('customers').select('*');
      if (customersData) setCustomers(customersData);

      let { data: vehiclesData } = await supabase.from('vehicles').select('*');
      if (vehiclesData) setVehicles(vehiclesData);

      let { data: biltiesData } = await supabase.from('bilties').select('*');
      if (biltiesData) setBilties(biltiesData);

     let { data: tripsData } = await supabase.from('trips').select('*');
if (tripsData) {
  const parsedTrips = tripsData.map(trip => {
    let parsedBilties = [];
    try {
      if (typeof trip.selectedBilties === 'string') {
        // DB me text type hai, JSON string ko array me convert karo
        parsedBilties = JSON.parse(trip.selectedBilties);
      } else if (Array.isArray(trip.selectedBilties)) {
        parsedBilties = trip.selectedBilties;
      }
    } catch (e) {
      console.warn("Parse error for trip:", trip.tripNo, e);
      parsedBilties = [];
    }
    
    // Agar selectedBilties empty hai lekin biltyId hai, toh biltyId daalo
    if (parsedBilties.length === 0 && trip.biltyId) {
      parsedBilties = [trip.biltyId];
    }
    
    return { ...trip, selectedBilties: parsedBilties };
  });
  setTrips(parsedTrips);
}

      let { data: podsData } = await supabase.from('pods').select('*');
      if (podsData) setPods(podsData);

      let { data: billsData } = await supabase.from('bills').select('*');
      if (billsData) setBills(billsData);

      let { data: accountsData } = await supabase.from('accounts').select('*');
      if (accountsData) setAccounts(accountsData);

            let { data: visitsData } = await supabase.from('customer_visits').select('*').order('visit_date', { ascending: false });
      if (visitsData) setCustomerVisits(visitsData);
      // 🔥 TRACKING VEHICLES LOAD
let { data: trackingData } = await supabase.from('tracking').select('*');
if (trackingData) setTrackingVehicles(trackingData);

    } catch (e) {
      console.log("Error loading data:", e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

// =========================================================
  // AUTO-BACKUP   // ← YE NAYA CODE YAHAN PASTE KAREIN
  // =========================================================

  useEffect(() => {
    if (customers.length > 0 || vehicles.length > 0 || bilties.length > 0) {
      try {
        const backupData = {
          customers,
          vehicles,
          bilties,
          trips,
          accounts,
          pods,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('dhr_last_backup', JSON.stringify(backupData));
      } catch (e) {
        console.log('Backup error:', e);
      }
    }
  }, [customers, vehicles, bilties, trips, accounts, pods]);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const goTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const login = async (e) => {
  e.preventDefault();
  setLoginLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) throw error;
    
    // Role fetch karo, agar nahi mila toh default STAFF
    try {
      const { data: userProfile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      setUserRole(userProfile?.role || 'STAFF');
    } catch (roleError) {
      console.log("⚠️ No role found, setting default STAFF");
      setUserRole('STAFF');
    }
    
    alert("✅ Login successful!");
  } catch (error) {
    alert("❌ Login failed: " + error.message);
  }
  setLoginLoading(false);
};

  const logout = () => {
    supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    setPage("dashboard");
  };
    // =========================================================
  // BILL FUNCTIONS
  // =========================================================

  const getNextBillNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const existingBills = bills.filter(bill => 
      bill.billNo && bill.billNo.startsWith(`INV-${year}-${month}`)
    );
    
    const nextNumber = existingBills.length + 1;
    return `INV-${year}-${month}-${String(nextNumber).padStart(4, '0')}`;
  };

  const updateBill = (e) => {
    const { name, value } = e.target;
    setBillForm(prev => ({ ...prev, [name]: value }));
  };

  const updateBillItem = (index, field, value) => {
    const updatedItems = [...billForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = qty * rate;
    }
    
    const subtotal = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    
    setBillForm(prev => ({
      ...prev,
      items: updatedItems,
      subtotal: subtotal,
      cgst: cgst,
      sgst: sgst,
      total: subtotal + cgst + sgst
    }));
  };

  const addBillItem = () => {
    setBillForm(prev => ({
      ...prev,
      items: [...prev.items, { ...createEmptyBillItem(), id: Date.now() + Math.random() }]
    }));
  };

  const removeBillItem = (index) => {
    const updatedItems = billForm.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    
    setBillForm(prev => ({
      ...prev,
      items: updatedItems,
      subtotal: subtotal,
      cgst: cgst,
      sgst: sgst,
      total: subtotal + cgst + sgst
    }));
  };

  const selectBillParty = (partyName) => {
    const customer = customers.find(c => c.name === partyName);
    setBillForm(prev => ({
      ...prev,
      partyName: partyName,
      partyGST: customer?.gst || "",
      partyAddress: customer?.address || ""
    }));
  };

   const saveBill = async () => {
  console.log("🚀 SAVE BILL STARTED");
  console.log("📝 billForm:", billForm);
  
  if (!billForm.partyName) { alert("Please select Party/Customer."); return; }
  if (billForm.items.length === 0) { alert("Please add at least one item."); return; }

  // 🔥 BILL NUMBER GENERATE KARO
  let billNo = billForm.billNo;
  if (!billNo) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const existingBills = bills.filter(b => 
      b.billNo && b.billNo.startsWith(`INV-${year}-${month}`)
    );
    billNo = `INV-${year}-${month}-${String(existingBills.length + 1).padStart(4, '0')}`;
  }

  // 🔥 ITEMS KO STRING/JSON MEIN CONVERT KARO
  const itemsWithStrings = billForm.items.map(item => ({
    ...item,
    rate: String(item.rate || 0),
    amount: String(item.amount || 0),
    quantity: String(item.quantity || 1),
    actualWeight: String(item.actualWeight || 0),
    chargeWeight: String(item.chargeWeight || 0),
  }));

  const finalData = {
    billNo: billNo,
    date: billForm.date || new Date().toISOString().slice(0, 10),
    partyName: billForm.partyName || "",
    partyGST: billForm.partyGST || "",
    partyAddress: billForm.partyAddress || "",
    billType: billForm.billType || "TAX INVOICE",
    vchNo: billForm.vchNo || "",
    biltyNo: billForm.biltyNo || "",
    deliveryNote: billForm.deliveryNote || "",
    paymentTerms: billForm.paymentTerms || "",
    referenceNo: billForm.referenceNo || "",
    destination: billForm.destination || "",
    termsOfDelivery: billForm.termsOfDelivery || "",
    items: itemsWithStrings,
    subtotal: String(billForm.subtotal || 0),
    cgst: String(billForm.cgst || 0),
    sgst: String(billForm.sgst || 0),
    total: String(billForm.total || 0),
    igstRate: String(billForm.igstRate || 5),
    remarks: billForm.remarks || "",
    createdAt: new Date().toISOString()
  };

  console.log("💾 FINAL DATA SENDING:", finalData);

  try {
    let result;
    if (editingBill && editingBill.id) {
      result = await supabase
        .from('bills')
        .update(finalData)
        .eq('id', editingBill.id);
    } else {
      result = await supabase
        .from('bills')
        .insert([finalData]);
    }
    
    console.log("📊 RESULT:", result);
    
    if (result.error) throw result.error;
    
    alert(`✅ Bill ${billNo} created successfully!`);
    setBillForm(createEmptyBill());
    setEditingBill(null);
    await loadAllData();
  } catch (e) { 
    console.error("❌ ERROR:", e);
    alert("❌ Error: " + e.message); 
  }
};

  const editBill = (bill) => {
    setBillForm({ ...bill });
    setEditingBill(bill);
    setPage("bills");
  };

    const deleteBill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    try {
      let { error } = await supabase.from('bills').delete().eq('id', id);
      if (!error) { loadAllData(); }
    } catch (e) { alert("❌ Error: " + e.message); }
  };

  const newBill = () => {
    setEditingBill(null);
    setBillForm({
      ...createEmptyBill(),
      billNo: getNextBillNumber()
    });
    setPage("bills");
  };

  // =========================================================
  // BILTY NUMBER
  // =========================================================

  const getNextBiltyNumber = () => {
    const year = new Date().getFullYear();

    let max = 0;

    bilties.forEach((item) => {
      const match = String(item.bilty || "").match(
        new RegExp(`DHR-${year}-(\\d+)`)
      );

      if (match) {
        max = Math.max(max, Number(match[1]));
      }
    });

    return `DHR-${year}-${String(max + 1).padStart(5, "0")}`;
  };

  const getNextTripNumber = () => {
    return getNextNumber(trips, "tripNo", "TRIP");
  };

  // =========================================================
  // CUSTOMER
  // =========================================================

  const updateCustomer = (e) => {
    const { name, value } = e.target;

    setCustomerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

   const fetchGST = async () => {
  const gst = customerForm.gst.trim().toUpperCase();

  if (!gst) {
    alert("GST Number enter karein.");
    return;
  }

  if (gst.length !== 15) {
    alert("GST Number 15 characters ka hona chahiye.");
    return;
  }

  try {
    // ✅ PROXY API USE KARO (CORS bypass)
    const response = await fetch(`https://api.allorigins.win/raw?url=https://services.gst.gov.in/services/api/gstinfo?gstin=${gst}`);
    const data = await response.json();
    console.log("API Response:", data);

    if (data && data.lgnm) {
      setCustomerForm(prev => ({
        ...prev,
        gst: gst,
        name: data.lgnm || "",
        address: data.adr || "",
        state: data.stcd || "",
        stateCode: gst.substring(0, 2),
      }));
      alert("✅ GST details fetched successfully!");
    } else {
      alert("❌ GSTIN details nahi mili. Sahi number check karein.");
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    alert("❌ GST API Error: Manually enter details.");
  }
};
   const saveCustomer = async () => {
  const name = customerForm.name.trim();
  const gst = customerForm.gst.trim().toUpperCase();
  
  if (!name) { alert("Customer / Party Name enter karein."); return; }
  if (!gst) { alert("GST Number enter karein."); return; }
  if (gst.length !== 15) { alert("GST Number 15 characters ka hona chahiye."); return; }

  try {
    // 🔥 SIRF EXISTING COLUMNS BHEJO - stateCode HATAO
    const customerData = {
      name: name,
      gst: gst,
      partyType: customerForm.partyType || "BOTH",
      address: customerForm.address || "",
      state: customerForm.state || "",
      mobile: customerForm.mobile || "",
      email: customerForm.email || "",
    };
    
    console.log("📝 Saving customer:", customerData);

    if (editingCustomer) {
      let { error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', editingCustomer);
      if (error) throw error;
      alert("✅ Customer updated successfully.");
    } else {
      let { error } = await supabase
        .from('customers')
        .insert([customerData]);
      if (error) throw error;
      alert("✅ Customer saved successfully.");
    }
    
    setCustomerForm({ ...emptyCustomer });
    setEditingCustomer(null);
    await loadAllData();
    
  } catch (e) { 
    console.error("❌ Save error:", e);
    alert("❌ Error: " + e.message); 
  }
};
  const editCustomer = (customer) => {
    setCustomerForm({
      ...emptyCustomer,
      ...customer,
    });

    setEditingCustomer(customer.id);
    setPage("customers");
    goTop();
  };

    const deleteCustomer = async (id) => {
    if (!window.confirm("Kya aap is customer ko delete karna chahte hain?")) return;
    try {
      let { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) { loadAllData(); }
    } catch (e) { alert("❌ Error: " + e.message); }
  };

  const customerRoleLabel = (type) => {
    if (type === "CONSIGNOR") return "C/NOR";
    if (type === "CONSIGNEE") return "C/NEE";
    return "C/NOR + C/NEE";
  };

  // =========================================================
  // VEHICLE
  // =========================================================

  const updateVehicle = (e) => {
    const { name, value } = e.target;

    setVehicleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchVehicle = () => {
    const number = vehicleForm.vehicleNo.trim().toUpperCase();

    if (!number) {
      alert("Vehicle Number enter karein.");
      return;
    }

    setVehicleForm((prev) => ({
      ...prev,
      vehicleNo: number,
      ownerName: prev.ownerName || "Vehicle Owner",
      vehicleType: prev.vehicleType || "32 Feet",
      capacity: prev.capacity || "25000",
    }));

    alert(
      "Demo vehicle details fill hui hain. Actual RTO API baad mein connect ki ja sakti hai."
    );
  };

    const saveVehicle = async () => {
    const number = vehicleForm.vehicleNo.trim().toUpperCase();

    if (!number) {
      alert("Vehicle Number enter karein.");
      return;
    }

    if (!vehicleForm.vehicleType) {
      alert("Vehicle Type select karein.");
      return;
    }

    try {
      if (editingVehicle) {
        let { error } = await supabase.from('vehicles').update({ ...vehicleForm, vehicleNo: number }).eq('id', editingVehicle);
        if (!error) {
          alert("Vehicle updated successfully.");
        }
      } else {
        let { error } = await supabase.from('vehicles').insert([{ ...vehicleForm, vehicleNo: number }]);
        if (!error) {
          alert("Vehicle saved successfully.");
        }
      }
      setVehicleForm({ ...emptyVehicle });
      setEditingVehicle(null);
      loadAllData();
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
  };

    const deleteVehicle = async (id) => {
    if (!window.confirm("Kya aap is vehicle ko delete karna chahte hain?")) return;
    try {
      let { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (!error) {
        loadAllData();
      }
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
  };

  // =========================================================
  // BILTY
  // =========================================================

  const updateBilty = (e) => {
    const { name, value } = e.target;

    setBiltyForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectConsignor = (id) => {
    if (!id) {
      setBiltyForm((prev) => ({
        ...prev,
        consignorId: "",
        consignor: "",
        consignorAddress: "",
        consignorGST: "",
      }));
      return;
    }

    const customer = customers.find(
      (item) => String(item.id) === String(id)
    );

    if (!customer) return;

    setBiltyForm((prev) => ({
      ...prev,
      consignorId: customer.id,
      consignor: customer.name,
      consignorAddress: customer.address,
      consignorGST: customer.gst,
    }));
  };

  const selectConsignee = (id) => {
    if (!id) {
      setBiltyForm((prev) => ({
        ...prev,
        consigneeId: "",
        consignee: "",
        consigneeAddress: "",
        consigneeGST: "",
      }));
      return;
    }

    const customer = customers.find(
      (item) => String(item.id) === String(id)
    );

    if (!customer) return;

    setBiltyForm((prev) => ({
      ...prev,
      consigneeId: customer.id,
      consignee: customer.name,
      consigneeAddress: customer.address,
      consigneeGST: customer.gst,
    }));
  };

  const selectVehicle = (id) => {
    if (!id) {
      setBiltyForm((prev) => ({
        ...prev,
        vehicleId: "",
        vehicle: "",
        vehicleType: "",
        driver: "",
        driverMobile: "",
      }));
      return;
    }

    const vehicle = vehicles.find(
      (item) => String(item.id) === String(id)
    );

    if (!vehicle) return;

    setBiltyForm((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicle: vehicle.vehicleNo,
      vehicleType: vehicle.vehicleType,
      driver: vehicle.driverName,
      driverMobile: vehicle.driverMobile,
    }));
  };

    const saveBilty = async () => {
  console.log("🚀 SAVE BILTY STARTED");
  console.log("📝 biltyForm:", biltyForm);
  
  // 🔥 YE CHECK KARO - KYA VALUES AA RAHI HAIN?
  console.log("consignorId:", biltyForm.consignorId);
  console.log("consigneeId:", biltyForm.consigneeId);
  console.log("vehicleId:", biltyForm.vehicleId);
  console.log("material:", biltyForm.material);
  console.log("actualWeight:", biltyForm.actualWeight);
  console.log("chargeWeight:", biltyForm.chargeWeight);
  
  if (!biltyForm.consignorId) { alert("Consignor select karein."); return; }
  if (!biltyForm.consigneeId) { alert("Consignee select karein."); return; }
  if (!biltyForm.vehicleId) { alert("Vehicle select karein."); return; }
  if (!biltyForm.material.trim()) { alert("Material enter karein."); return; }
  if (!biltyForm.actualWeight) { alert("Actual Weight enter karein."); return; }
  if (!biltyForm.chargeWeight) { alert("Charge Weight enter karein."); return; }

  let biltyNumber = biltyForm.bilty;
  if (!editingBilty && biltyMode === "automatic") { 
    biltyNumber = getNextBiltyNumber(); 
  }
  if (!biltyNumber.trim()) { alert("Bilty Number enter karein."); return; }

  // 🔥 DUPLICATE BILTY CHECK
  const existingBilty = bilties.find((item) => 
    String(item.bilty || "").trim().toUpperCase() === String(biltyNumber).trim().toUpperCase() &&
    String(item.id) !== String(editingBilty?.id)
  );
  if (existingBilty) { alert(`❌ Bilty "${biltyNumber}" already exists!`); return; }

  const finalData = {
    bilty: biltyNumber,
    date: biltyForm.date || new Date().toISOString().slice(0, 10),
    consignor: biltyForm.consignor || "",
    consignee: biltyForm.consignee || "",
    pickup: biltyForm.pickup || "",
    delivery: biltyForm.delivery || "",
    material: biltyForm.material || "",
    actualWeight: String(biltyForm.actualWeight || 0),    // 🔥 ADD KARO
  chargeWeight: String(biltyForm.chargeWeight || 0),    // 🔥 ADD KARO
  freight: String(biltyForm.freight || 0),
  advance: String(biltyForm.advance || 0),              // 🔥 ADD KARO
  vehicle: biltyForm.vehicle || "",
  vehicleType: biltyForm.vehicleType || "",             // 🔥 ADD KARO
  driver: biltyForm.driver || "",                       // 🔥 ADD KARO
  driverMobile: biltyForm.driverMobile || "",           // 🔥 ADD KARO
  loadingDate: biltyForm.loadingDate || null,           // 🔥 ADD KARO
  expectedDelivery: biltyForm.expectedDelivery || null, // 🔥 ADD KARO
    status: biltyForm.status || "Booked",
    // 🔥 SINGLE E-WAY BILL (Backward compatibility)
    ewayBillNo: biltyForm.ewayBillNo || "",
    ewayBillExpiry: biltyForm.ewayBillExpiry || "",
    // 🔥 MULTI E-WAY BILL
    ewayBills: biltyForm.ewayBills || [],
    materialValue: String(biltyForm.materialValue || 0),
    remarks: biltyForm.remarks || "",
  };

  console.log("💾 FINAL DATA SENDING:", finalData);

  try {
    let result;
    if (editingBilty && editingBilty.id) {
      result = await supabase
        .from('bilties')
        .update(finalData)
        .eq('id', editingBilty.id);
    } else {
      result = await supabase
        .from('bilties')
        .insert([finalData]);
    }
    
    console.log("📊 RESULT:", result);
    
    if (result.error) throw result.error;
    
    alert(`✅ Bilty ${biltyNumber} successfully created.`);
    setBiltyForm(createEmptyBilty());
    setEditingBilty(null);
    await loadAllData();
  } catch (e) { 
    console.error("❌ ERROR:", e);
    alert("❌ Error: " + e.message); 
  }
};

    const deleteBilty = async (id) => {
    if (!window.confirm("Kya aap is Bilty ko delete karna chahte hain?")) return;
    try {
      let { error } = await supabase.from('bilties').delete().eq('id', id);
      if (!error) { loadAllData(); }
    } catch (e) { alert("❌ Error: " + e.message); }
  };
  const newBilty = () => {
    setEditingBilty(null);
    setBiltyMode("automatic");

    setBiltyForm({
      ...createEmptyBilty(),
      bilty: getNextBiltyNumber(),
    });

    setPage("bilty");
    goTop();
  };

  const editBilty = (item) => {
  setBiltyForm({
    ...createEmptyBilty(),
    ...item,
    consignorId: item.consignorId || "",
    consigneeId: item.consigneeId || "",
    vehicleId: item.vehicleId || "",
  });
  setEditingBilty(item);
  setPage("bilty");
  goTop();
};

  // =========================================================
  // TRIP
  // =========================================================

  const updateTrip = (e) => {
    const { name, value } = e.target;

    setTripForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

const selectTripBilty = (id) => {
  if (!id) {
    setTripForm((prev) => ({
      ...prev,
      biltyId: "",
      biltyNo: "",
      vehicleId: "",
      vehicleNo: "",
      vehicleType: "",
      driverName: "",
      driverMobile: "",
      from: "",
      to: "",
      bookingFreight: 0,
      pendingBilties: [],
      selectedBilties: [],
    }));
    return;
  }

  const bilty = bilties.find(
    (item) => String(item.id) === String(id)
  );

  if (!bilty) return;

  const vehicle = vehicles.find(
    (item) => String(item.id) === String(bilty.vehicleId)
  );

  // 🔥🔥 SABSE IMPORTANT CHANGE 🔥🔥
  // Saari trips ki SAARI bilty IDs nikaalo (selectedBilties array se)
  const allTripBiltyIds = [];
  
  trips.forEach(trip => {
    // Edit mode me current trip ko ignore karo
    if (editingTrip && String(trip.id) === String(editingTrip.id)) return;
    
    // selectedBilties array se saari IDs lo
    if (trip.selectedBilties && Array.isArray(trip.selectedBilties)) {
      trip.selectedBilties.forEach(bId => {
        allTripBiltyIds.push(String(bId));
      });
    }
    
    // Purani trips ke liye biltyId bhi check karo
    if (trip.biltyId) {
      allTripBiltyIds.push(String(trip.biltyId));
    }
  });
  
  console.log("🔍 Already Used Bilty IDs:", allTripBiltyIds);
  console.log("🔍 Current Bilty ID:", String(bilty.id));
  
  // 🔥 PENDING BILTIES: Sirf wahi jo kisi trip me NAHI gayi
  const pendingBilties = bilties.filter(
    (item) => 
      String(item.vehicleId) === String(bilty.vehicleId) && 
      item.status !== "Delivered" &&
      !allTripBiltyIds.includes(String(item.id))
  );
  
  console.log("📦 Pending Bilties:", pendingBilties.map(b => b.bilty));

  const selectedIds = [bilty.id];
  const totalFreight = bilties
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + Number(item.freight || 0), 0);

  setTripForm((prev) => ({
    ...prev,
    biltyId: bilty.id,
    biltyNo: bilty.bilty,
    vehicleId: bilty.vehicleId || "",
    vehicleNo: bilty.vehicle || vehicle?.vehicleNo || "",
    vehicleType: bilty.vehicleType || vehicle?.vehicleType || "",
    driverName: bilty.driver || vehicle?.driverName || "",
    driverMobile: bilty.driverMobile || vehicle?.driverMobile || "",
    from: bilty.pickup || "",
    to: bilty.delivery || "",
    bookingFreight: totalFreight,
    pendingBilties: pendingBilties,
    selectedBilties: selectedIds,
  }));
};
  const selectTripVehicle = (id) => {
    if (!id) {
      setTripForm((prev) => ({
        ...prev,
        vehicleId: "",
        vehicleNo: "",
        vehicleType: "",
        driverName: "",
        driverMobile: "",
      }));

      return;
    }

    const vehicle = vehicles.find(
      (item) => String(item.id) === String(id)
    );

    if (!vehicle) return;

    setTripForm((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicleNo: vehicle.vehicleNo,
      vehicleType: vehicle.vehicleType,
      driverName: vehicle.driverName,
      driverMobile: vehicle.driverMobile,
    }));
  };

  const tripTotals = useMemo(() => {
    const lorryFreight = Number(tripForm.lorryFreight || 0);
    const advance = Number(tripForm.advance || 0);

    const damageAddition = Number(tripForm.damageAddition || 0);
    const damageDeduction = Number(tripForm.damageDeduction || 0);

    const haltingAddition = Number(tripForm.haltingAddition || 0);
    const haltingDeduction = Number(tripForm.haltingDeduction || 0);

    const otherAddition = Number(tripForm.otherAddition || 0);
    const otherDeduction = Number(tripForm.otherDeduction || 0);

    const additions =
      damageAddition + haltingAddition + otherAddition;

    const deductions =
      damageDeduction + haltingDeduction + otherDeduction;

    const adjustedLorryHire =
      lorryFreight + additions - deductions;

    const balance =
      adjustedLorryHire - advance;

    const bookingFreight =
      Number(tripForm.bookingFreight || 0);

    const margin =
      bookingFreight - lorryFreight;

    const marginPercent =
      bookingFreight > 0
        ? (margin / bookingFreight) * 100
        : 0;

    return {
      lorryFreight,
      advance,
      additions,
      deductions,
      adjustedLorryHire,
      balance,
      bookingFreight,
      margin,
      marginPercent,
    };
  }, [tripForm]);

        const saveTrip = async () => {
    console.log("🚀 SAVE TRIP STARTED");
    console.log("📝 tripForm:", tripForm);
    
    if (!tripForm.biltyId) { alert("Bilty select karein."); return; }
    if (!tripForm.vehicleId) { alert("Vehicle select karein."); return; }
    if (!tripForm.lorryFreight) { alert("Lorry Freight enter karein."); return; }

    // 🔥 SELECTED BILTIES
    const selectedBilties = Array.isArray(tripForm.selectedBilties) 
      ? tripForm.selectedBilties 
      : [];
    
    if (selectedBilties.length === 0) { 
      alert("At least one Bilty select karein."); 
      return; 
    }

    console.log("🔍 Selected Bilty IDs:", selectedBilties);

    // 🔥 TOTAL FREIGHT
    const totalFreight = bilties
      .filter(b => selectedBilties.includes(b.id))
      .reduce((sum, b) => sum + Number(b.freight || 0), 0);

    // =====================================================
    // EDIT MODE
    // =====================================================
    if (editingTrip && editingTrip.id) {
      const mainBilty = bilties.find(b => String(b.id) === String(selectedBilties[0]));

      const tripData = {
        tripNo: tripForm.tripNo || getNextTripNumber(),
        tripDate: tripForm.tripDate || new Date().toISOString().slice(0, 10),
        biltyId: mainBilty?.id || "",
        biltyNo: mainBilty?.bilty || "",
        selectedBilties: JSON.stringify(selectedBilties),
        vehicleId: tripForm.vehicleId || "",
        vehicleNo: tripForm.vehicleNo || "",
        vehicleType: tripForm.vehicleType || "",
        driverName: tripForm.driverName || "",
        driverMobile: tripForm.driverMobile || "",
        brokerName: tripForm.brokerName || "",
        from: tripForm.from || "",
        to: tripForm.to || "",
        bookingFreight: String(totalFreight || 0),
        lorryFreight: String(tripForm.lorryFreight || 0),
        advance: String(tripForm.advance || 0),
        status: tripForm.status || "DISPATCHED",
        receivedDate: tripForm.receivedDate || null,
        lorryHireBalance: String(tripForm.lorryHireBalance || 0),
        damageAddition: String(tripForm.damageAddition || 0),
        damageDeduction: String(tripForm.damageDeduction || 0),
        haltingAddition: String(tripForm.haltingAddition || 0),
        haltingDeduction: String(tripForm.haltingDeduction || 0),
        otherAddition: String(tripForm.otherAddition || 0),
        otherDeduction: String(tripForm.otherDeduction || 0),
        claimAmount: String(tripForm.claimAmount || 0),
        claimReason: tripForm.claimReason || "",
        remarks: tripForm.remarks || "",
        ewayBillNo: tripForm.ewayBillNo || "",
        ewayBillExpiry: tripForm.ewayBillExpiry || null,
        materialValue: String(tripForm.materialValue || 0),
      };

      try {
        const result = await supabase
          .from('trips')
          .update(tripData)
          .eq('id', editingTrip.id);
        
        if (result.error) throw result.error;
        
        alert(`✅ Trip ${tripData.tripNo} updated successfully!`);
        setTripForm(createEmptyTrip());
        setEditingTrip(null);
        await loadAllData();
      } catch (e) { 
        console.error("❌ ERROR:", e);
        alert("❌ Error: " + e.message); 
      }
      return;
    }

    // =====================================================
    // CREATE MODE - हर bilty के लिए अलग row insert
    // =====================================================
    const baseTripNo = tripForm.tripNo || getNextTripNumber();
    const lorryFreightTotal = Number(tripForm.lorryFreight || 0);
    const advanceTotal = Number(tripForm.advance || 0);

    // 🔥 सब selected bilty objects निकालो
    const selectedBiltyObjects = bilties.filter(b => 
      selectedBilties.includes(b.id)
    );

    console.log("📦 Selected Bilty Objects:", selectedBiltyObjects.length);

    // 🔥 Total booking freight
    const totalBookingFreight = selectedBiltyObjects.reduce(
      (sum, b) => sum + Number(b.freight || 0), 
      0
    );

    // 🔥 हर bilty के लिए एक row बनाओ
    const tripRecords = [];
    const allSelectedIds = selectedBilties.map(id => String(id));

    selectedBiltyObjects.forEach((bilty, idx) => {
      const biltyFreight = Number(bilty.freight || 0);

      // Proportional distribution
      const ratio = totalBookingFreight > 0 
        ? biltyFreight / totalBookingFreight 
        : (1 / selectedBiltyObjects.length);
      
      const biltyLorryFreight = lorryFreightTotal * ratio;
      const biltyAdvance = advanceTotal * ratio;
      const biltyBalance = biltyLorryFreight - biltyAdvance;

      const isFirst = idx === 0;

      const tripData = {
        tripNo: baseTripNo,
        tripDate: tripForm.tripDate || new Date().toISOString().slice(0, 10),
        biltyId: bilty.id,
        biltyNo: bilty.bilty,
        // 🔥🔥🔥 ये सबसे important है — JSON STRING में सबकी IDs
        selectedBilties: JSON.stringify(allSelectedIds),
        vehicleId: tripForm.vehicleId || "",
        vehicleNo: tripForm.vehicleNo || "",
        vehicleType: tripForm.vehicleType || "",
        driverName: tripForm.driverName || "",
        driverMobile: tripForm.driverMobile || "",
        brokerName: tripForm.brokerName || "",
        from: bilty.pickup || tripForm.from || "",
        to: bilty.delivery || tripForm.to || "",
        bookingFreight: String(biltyFreight),
        lorryFreight: String(biltyLorryFreight.toFixed(2)),
        advance: String(biltyAdvance.toFixed(2)),
        status: tripForm.status || "DISPATCHED",
        receivedDate: tripForm.receivedDate || null,
        lorryHireBalance: String(biltyBalance.toFixed(2)),
        damageAddition: isFirst ? String(tripForm.damageAddition || 0) : "0",
        damageDeduction: isFirst ? String(tripForm.damageDeduction || 0) : "0",
        haltingAddition: isFirst ? String(tripForm.haltingAddition || 0) : "0",
        haltingDeduction: isFirst ? String(tripForm.haltingDeduction || 0) : "0",
        otherAddition: isFirst ? String(tripForm.otherAddition || 0) : "0",
        otherDeduction: isFirst ? String(tripForm.otherDeduction || 0) : "0",
        claimAmount: isFirst ? String(tripForm.claimAmount || 0) : "0",
        claimReason: isFirst ? (tripForm.claimReason || "") : "",
        remarks: tripForm.remarks || "",
        ewayBillNo: tripForm.ewayBillNo || "",
        ewayBillExpiry: tripForm.ewayBillExpiry || null,
        materialValue: String(tripForm.materialValue || 0),
      };

      tripRecords.push(tripData);
    });

    console.log("📊 TRIP RECORDS TO INSERT:", tripRecords.length);
    console.log("📦 TRIP RECORDS:", tripRecords);

    try {
      // 🔥 BULK INSERT — सब rows एक साथ
      const result = await supabase
        .from('trips')
        .insert(tripRecords);
      
      if (result.error) throw result.error;
      
      // बिल्टी status update
      for (const biltyId of selectedBilties) {
        await supabase
          .from('bilties')
          .update({ status: 'Dispatched' })
          .eq('id', biltyId);
      }
      
      alert(
        `✅ Trip ${baseTripNo} created!\n\n` +
        `📦 ${tripRecords.length} Bilty(s):\n` +
        tripRecords.map(t => `• ${t.biltyNo} → ₹${t.bookingFreight}`).join('\n')
      );
      
      setTripForm(createEmptyTrip());
      setEditingTrip(null);
      await loadAllData();
      
    } catch (e) { 
      console.error("❌ ERROR:", e);
      alert("❌ Error: " + e.message); 
    }
  };
    const deleteTrip = async (id) => {
    if (!window.confirm("Kya aap is Trip ko delete karna chahte hain?")) return;
    try {
      let { error } = await supabase.from('trips').delete().eq('id', id);
      if (!error) { loadAllData(); }
    } catch (e) { alert("❌ Error: " + e.message); }
  };

  const newTrip = () => {
    setEditingTrip(null);

    setTripForm({
      ...createEmptyTrip(),
      tripNo: getNextTripNumber(),
    });

    setPage("trips");
    goTop();
  };

  // =========================================================
// EDIT TRIP FUNCTION
// =========================================================

const editTrip = (item) => {
  console.log("✏️ EDIT TRIP CALLED:", item);
  
let selectedBilties = Array.isArray(item.selectedBilties) 
  ? item.selectedBilties 
  : [];
  
  if (selectedBilties.length === 0 && item.biltyId) {
    selectedBilties = [item.biltyId];
  }
  
  // 🔥 Current trip ki Bilty ko selectedBilties mein add karo
  if (item.biltyId && !selectedBilties.includes(item.biltyId)) {
    selectedBilties = [item.biltyId, ...selectedBilties];
  }
  
  // 🔥 PENDING BILTIES CALCULATE (EDIT MODE — current trip ko ignore karo)
  const allTripBiltyIds = trips
    .filter(t => String(t.id) !== String(item.id))
    .map(t => String(t.biltyId));
  
  const pendingBilties = bilties.filter(
    (b) => 
      String(b.vehicleId) === String(item.vehicleId) && 
      b.status !== "Delivered" &&
      !allTripBiltyIds.includes(String(b.id))
  );

  setTripForm({
    ...createEmptyTrip(),
    ...item,
    tripNo: item.tripNo || getNextTripNumber(),
    tripDate: item.tripDate || new Date().toISOString().slice(0, 10),
    biltyId: item.biltyId || "",
    biltyNo: item.biltyNo || "",
    vehicleId: item.vehicleId || "",
    vehicleNo: item.vehicleNo || "",
    vehicleType: item.vehicleType || "",
    driverName: item.driverName || "",
    driverMobile: item.driverMobile || "",
    brokerName: item.brokerName || "",
    from: item.from || "",
    to: item.to || "",
    bookingFreight: Number(item.bookingFreight || 0),
    lorryFreight: item.lorryFreight || "",
    advance: item.advance || "",
    status: item.status || "DISPATCHED",
    receivedDate: item.receivedDate || "",
    lorryHireBalance: item.lorryHireBalance || "",
    damageAddition: item.damageAddition || "",
    damageDeduction: item.damageDeduction || "",
    haltingAddition: item.haltingAddition || "",
    haltingDeduction: item.haltingDeduction || "",
    otherAddition: item.otherAddition || "",
    otherDeduction: item.otherDeduction || "",
    claimAmount: item.claimAmount || "",
    claimReason: item.claimReason || "",
    remarks: item.remarks || "",
    ewayBillNo: item.ewayBillNo || "",
    ewayBillExpiry: item.ewayBillExpiry || "",
    materialValue: item.materialValue || "",
    selectedBilties: selectedBilties,
    pendingBilties: pendingBilties,
  });
  
  setEditingTrip(item);
  setPage("trips");
  goTop();
};

    const renderLoginPage = () => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        background: 'linear-gradient(135deg, #102a43 0%, #1a3a5c 100%)'
      }}>
        <div className="card" style={{ width: '400px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <h2 style={{ textAlign: 'center', color: '#102a43', marginBottom: '30px' }}>
            🔐 ERP Login
          </h2>
          <form onSubmit={login}>
            <div className="field" style={{ marginBottom: '15px' }}>
              <label>Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="field" style={{ marginBottom: '20px' }}>
              <label>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="greenBtn" type="submit" style={{ width: '100%', padding: '12px' }}>
              {loginLoading ? "Please wait..." : "🔐 LOGIN"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // =========================================================
  // DASHBOARD
  // =========================================================

  const renderDashboard = () => {
    const totalBookingFreight = bilties.reduce(
      (sum, item) => sum + Number(item.freight || 0),
      0
    );

    const totalTripFreight = trips.reduce(
      (sum, item) => sum + Number(item.lorryFreight || 0),
      0
    );

    const estimatedMargin =
      totalBookingFreight - totalTripFreight;

    const marginPercent =
      totalBookingFreight > 0
        ? (estimatedMargin / totalBookingFreight) * 100
        : 0;

    return (
      <>
        <div className="pageTitle">
          <h2>Dashboard</h2>
          <p>Transport Management System</p>
        </div>

        <div className="dashboardCards">
          <div
            className="dashboardCard"
            onClick={newBilty}
          >
            <div className="dashIcon">🧾</div>
            <div>
              <h3>{bilties.length}</h3>
              <p>Total Bilty</p>
            </div>
          </div>

          <div
            className="dashboardCard"
            onClick={() => setPage("customers")}
          >
            <div className="dashIcon">👥</div>
            <div>
              <h3>{customers.length}</h3>
              <p>Total Customers</p>
            </div>
          </div>

          <div
            className="dashboardCard"
            onClick={() => setPage("vehicles")}
          >
            <div className="dashIcon">🚛</div>
            <div>
              <h3>{vehicles.length}</h3>
              <p>Total Vehicles</p>
            </div>
          </div>

        <div className="dashboardCard" onClick={() => setPage("trips")}>
  <div className="dashIcon">📦</div>
  <div>
    <h3>{trips.length}</h3>
    <p>Total LHC</p>
  </div>
</div>

          <div className="dashboardCard">
            <div className="dashIcon">₹</div>
            <div>
              <h3>₹{money(totalBookingFreight)}</h3>
              <p>Booking Freight</p>
            </div>
          </div>

          <div className="dashboardCard">
            <div className="dashIcon">🚚</div>
            <div>
              <h3>₹{money(totalTripFreight)}</h3>
              <p>Trip Freight</p>
            </div>
          </div>

          <div className="dashboardCard">
            <div className="dashIcon">📈</div>
            <div>
              <h3>₹{money(estimatedMargin)}</h3>
              <p>
                Margin {marginPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Quick Actions</h2>

          <div className="quickActions">
            <button className="greenBtn" onClick={newBilty}>
              + CREATE BILTY
            </button>

            <button
              className="blueBtn"
              onClick={() => {
                setCustomerForm({ ...emptyCustomer });
                setEditingCustomer(null);
                setPage("customers");
                goTop();
              }}
            >
              + CUSTOMER MASTER
            </button>

            <button
              className="blueBtn"
              onClick={() => {
                setVehicleForm({ ...emptyVehicle });
                setEditingVehicle(null);
                setPage("vehicles");
                goTop();
              }}
            >
              + VEHICLE MASTER
            </button>

            <button className="greenBtn" onClick={newTrip}>
  + CREATE LHC
</button>

             <button 
              className="blueBtn" 
              onClick={backupData}
              style={{ background: '#6b7280' }}
            >
              💾 BACKUP DATA
            </button>
            
            <button 
              className="blueBtn" 
              onClick={restoreData}
              style={{ background: '#1769aa' }}
            >
              📂 RESTORE DATA
            </button>
          </div>
        </div>
      </>
    );
  };
  // =========================================================
  // CUSTOMER PAGE
  // =========================================================

  const renderCustomerMaster = () => {
    const filteredCustomers = customers.filter((item) =>
      `${item.name} ${item.gst} ${item.mobile} ${item.partyType}`
        .toLowerCase()
        .includes(customerSearch.toLowerCase())
    );

    return (
    <>
        <div className="pageTitle">
          <h2>Customer Master</h2>
          <p>Customer / Party Master</p>
        </div>

        <div className="card">
          <div className="sectionHeader">
            <h3>
              {editingCustomer
                ? "Edit Customer"
                : "Add New Customer"}
            </h3>
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Customer / Party Name *</label>

              <input
                name="name"
                value={customerForm.name}
                onChange={updateCustomer}
                placeholder="ABC Industries"
              />
            </div>

            <div className="field">
              <label>Party Type *</label>

              <select
                name="partyType"
                value={customerForm.partyType}
                onChange={updateCustomer}
              >
                <option value="CONSIGNOR">
                  C/NOR — Consignor / Sender
                </option>

                <option value="CONSIGNEE">
                  C/NEE — Consignee / Receiver
                </option>

                <option value="BOTH">
                  BOTH — C/NOR + C/NEE
                </option>
              </select>
            </div>

            <div className="field">
              <label>GST Number *</label>

              <div className="inputButton">
                <input
                  name="gst"
                  value={customerForm.gst}
                  onChange={updateCustomer}
                  placeholder="07ABCDE1234F1Z5"
                  maxLength={15}
                />

                <button
                  type="button"
                  className="blueBtn"
                  onClick={fetchGST}
                >
                  FETCH GST
                </button>
              </div>
            </div>

            <div className="field">
              <label>State</label>

              <input
                name="state"
                value={customerForm.state}
                onChange={updateCustomer}
                placeholder="Haryana"
              />
            </div>


            <div className="field">
              <label>Mobile</label>

              <input
                name="mobile"
                value={customerForm.mobile}
                onChange={updateCustomer}
                maxLength={10}
                placeholder="9876543210"
              />
            </div>

            <div className="field">
              <label>Email</label>

              <input
                name="email"
                value={customerForm.email}
                onChange={updateCustomer}
                placeholder="customer@email.com"
              />
            </div>

            <div className="field full">
              <label>Address *</label>

              <textarea
                name="address"
                value={customerForm.address}
                onChange={updateCustomer}
                placeholder="Full customer address"
              />
            </div>
          </div>

          <div className="formButtons">
            {editingCustomer && (
              <button
                className="grayBtn"
                onClick={() => {
                  setEditingCustomer(null);
                  setCustomerForm({ ...emptyCustomer });
                }}
              >
                CANCEL
              </button>
            )}

            <button
              className="greenBtn"
              onClick={saveCustomer}
            >
              {editingCustomer
                ? "UPDATE CUSTOMER"
                : "SAVE CUSTOMER"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="listHeader">
            <div>
              <h2>Customer List</h2>
              <p>Total: {customers.length}</p>
            </div>

            <input
              className="search"
              placeholder="Search customer / GST / mobile..."
              value={customerSearch}
              onChange={(e) =>
                setCustomerSearch(e.target.value)
              }
            />
          </div>

          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Party Name</th>
                  <th>Type</th>
                  <th>GSTIN</th>
                  <th>Address</th>
                  <th>State</th>
                  <th>Mobile</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <strong>{item.name}</strong>
                      </td>

                      <td>
                        <span className="statusActive">
                          {customerRoleLabel(
                            item.partyType
                          )}
                        </span>
                      </td>

                      <td>{item.gst}</td>

                      <td>{item.address}</td>

                      <td>{item.state || "-"}</td>

                      <td>{item.mobile || "-"}</td>

                      <td>
                        <button
                          className="editBtn"
                          onClick={() =>
                            editCustomer(item)
                          }
                        >
                          EDIT
                        </button>

                        <button
                          className="deleteBtn"
                          onClick={() =>
                            deleteCustomer(item.id)
                          }
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {filteredCustomers.length === 0 && (
              <div className="empty">
                No customers found.
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // =========================================================
  // VEHICLE PAGE
  // =========================================================

  const renderVehicleMaster = () => {
    const filteredVehicles = vehicles.filter((item) =>
      `${item.vehicleNo} ${item.ownerName} ${item.driverName} ${item.vehicleType}`
        .toLowerCase()
        .includes(vehicleSearch.toLowerCase())
    );

    return (
      <>
        <div className="pageTitle">
          <h2>Vehicle Master</h2>
          <p>Vehicle & Driver Master</p>
        </div>

        <div className="card">
          <h3>
            {editingVehicle
              ? "Edit Vehicle"
              : "Add New Vehicle"}
          </h3>

          <div className="formGrid">
            <div className="field">
              <label>Vehicle Number *</label>

              <div className="inputButton">
                <input
                  name="vehicleNo"
                  value={vehicleForm.vehicleNo}
                  onChange={updateVehicle}
                  placeholder="HR55AB1234"
                />

                <button
                  type="button"
                  className="blueBtn"
                  onClick={fetchVehicle}
                >
                  FETCH
                </button>
              </div>
            </div>

            <div className="field">
              <label>Owner Name</label>

              <input
                name="ownerName"
                value={vehicleForm.ownerName}
                onChange={updateVehicle}
              />
            </div>

            <div className="field">
              <label>Vehicle Type *</label>

              <select
                name="vehicleType"
                value={vehicleForm.vehicleType}
                onChange={updateVehicle}
              >
                <option value="">
                  Select Vehicle Type
                </option>
                <option>Pickup</option>
                <option>Tata 407</option>
                <option>14 Feet</option>
                <option>17 Feet</option>
                <option>19 Feet</option>
                <option>20 Feet</option>
                <option>22 Feet</option>
                <option>24 Feet</option>
                <option>28 Feet</option>
                <option>32 Feet</option>
                <option>Trailer</option>
                <option>Container</option>
              </select>
            </div>

            <div className="field">
              <label>Capacity (KG)</label>

              <input
                type="number"
                name="capacity"
                value={vehicleForm.capacity}
                onChange={updateVehicle}
                placeholder="25000"
              />
            </div>

            <div className="field">
              <label>Driver Name</label>

              <input
                name="driverName"
                value={vehicleForm.driverName}
                onChange={updateVehicle}
              />
            </div>

            <div className="field">
              <label>Driver Mobile</label>

              <input
                name="driverMobile"
                value={vehicleForm.driverMobile}
                onChange={updateVehicle}
                maxLength={10}
              />
            </div>

            <div className="field">
              <label>RC Number</label>

              <input
                name="rcNo"
                value={vehicleForm.rcNo}
                onChange={updateVehicle}
              />
            </div>

            <div className="field">
              <label>Status</label>

              <select
                name="status"
                value={vehicleForm.status}
                onChange={updateVehicle}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="field">
              <label>Insurance Expiry</label>

              <input
                type="date"
                name="insuranceExpiry"
                value={vehicleForm.insuranceExpiry}
                onChange={updateVehicle}
              />
            </div>

            <div className="field">
              <label>Fitness Expiry</label>

              <input
                type="date"
                name="fitnessExpiry"
                value={vehicleForm.fitnessExpiry}
                onChange={updateVehicle}
              />
            </div>

            <div className="field">
              <label>Permit Expiry</label>

              <input
                type="date"
                name="permitExpiry"
                value={vehicleForm.permitExpiry}
                onChange={updateVehicle}
              />
            </div>

            <div className="field">
              <label>PUC Expiry</label>

              <input
                type="date"
                name="pucExpiry"
                value={vehicleForm.pucExpiry}
                onChange={updateVehicle}
              />
            </div>
          </div>

          <div className="formButtons">
            {editingVehicle && (
              <button
                className="grayBtn"
                onClick={() => {
                  setEditingVehicle(null);
                  setVehicleForm({ ...emptyVehicle });
                }}
              >
                CANCEL
              </button>
            )}

            <button
              className="greenBtn"
              onClick={saveVehicle}
            >
              {editingVehicle
                ? "UPDATE VEHICLE"
                : "SAVE VEHICLE"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="listHeader">
            <div>
              <h2>Vehicle List</h2>
              <p>Total: {vehicles.length}</p>
            </div>

            <input
              className="search"
              placeholder="Search vehicle / owner / driver..."
              value={vehicleSearch}
              onChange={(e) =>
                setVehicleSearch(e.target.value)
              }
            />
          </div>

          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vehicle</th>
                  <th>Owner</th>
                  <th>Type</th>
                  <th>Capacity KG</th>
                  <th>Driver</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map(
                  (item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <strong>{item.vehicleNo}</strong>
                      </td>

                      <td>
                        {item.ownerName || "-"}
                      </td>

                      <td>{item.vehicleType}</td>

                      <td>{item.capacity || "-"}</td>

                      <td>
                        {item.driverName || "-"}
                      </td>

                      <td>
                        {item.driverMobile || "-"}
                      </td>

                      <td>
                        <span
                          className={
                            item.status === "Active"
                              ? "statusActive"
                              : "statusInactive"
                          }
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="editBtn"
                          onClick={() =>
                            editVehicle(item)
                          }
                        >
                          EDIT
                        </button>

                        <button
                          className="deleteBtn"
                          onClick={() =>
                            deleteVehicle(item.id)
                          }
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {filteredVehicles.length === 0 && (
              <div className="empty">
                No vehicles found.
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  

 // =========================================================
// BILTY PAGE
// =========================================================

const renderBiltyPage = () => {

  const consignors = customers.filter((item) => {
    const type = String(item.partyType || "")
      .trim()
      .toUpperCase();

    return (
      type === "CONSIGNOR" ||
      type === "BOTH"
    );
  });

  const consignees = customers.filter((item) => {
    const type = String(item.partyType || "")
      .trim()
      .toUpperCase();

    return (
      type === "CONSIGNEE" ||
      type === "BOTH"
    );
  });
console.log(
  "CUSTOMER PARTY TYPES:",
  customers.map((item) => ({
    name: item.name,
    partyType: item.partyType,
    type: typeof item.partyType,
  }))
);

  const filteredBilties = bilties.filter((item) =>
    `${item.bilty} ${item.consignor} ${item.consignee} ${item.vehicle} ${item.pickup} ${item.delivery}`
      .toLowerCase()
      .includes(biltySearch.toLowerCase())
  );
    return (
      <>
        <div className="pageTitle">
          <h2>
            {editingBilty ? "Edit Bilty" : "Create Bilty"}
          </h2>

          <p>
            Consignment Note / Transport Document
          </p>
        </div>

        <div className="card">
          <div className="biltyTop">
            <div className="field">
              <label>Bilty Number</label>

              <div className="modeButtons">
                <button
                  type="button"
                  className={
                    biltyMode === "automatic"
                      ? "modeActive"
                      : ""
                  }
                  onClick={() => {
                    setBiltyMode("automatic");

                    if (!editingBilty) {
                      setBiltyForm((prev) => ({
                        ...prev,
                        bilty: getNextBiltyNumber(),
                      }));
                    }
                  }}
                >
                  AUTOMATIC
                </button>

                <button
                  type="button"
                  className={
                    biltyMode === "manual"
                      ? "modeActive"
                      : ""
                  }
                  onClick={() => {
                    setBiltyMode("manual");

                    if (!editingBilty) {
                      setBiltyForm((prev) => ({
                        ...prev,
                        bilty: "",
                      }));
                    }
                  }}
                >
                  MANUAL
                </button>
              </div>

              <input
                name="bilty"
                value={biltyForm.bilty}
                disabled={
                  biltyMode === "automatic" &&
                  !editingBilty
                }
                onChange={updateBilty}
                placeholder="DHR-2026-00001"
              />
            </div>

            <div className="field">
              <label>Booking Date</label>

              <input
                type="date"
                name="date"
                value={biltyForm.date}
                onChange={updateBilty}
              />
            </div>
          </div>

          <div className="sectionTitle">
            CONSIGNOR — SENDER / भेजने वाला
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Select C/NOR *</label>

              <select
                value={biltyForm.consignorId}
                onChange={(e) =>
                  selectConsignor(e.target.value)
                }
              >
                <option value="">
                  Select Consignor
                </option>

                {consignors.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} —{" "}
                    {customerRoleLabel(
                      item.partyType
                    )}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Consignor Name</label>

              <input
                name="consignor"
                value={biltyForm.consignor}
                onChange={updateBilty}
              />
            </div>

            <div className="field full">
              <label>Consignor Address</label>

              <textarea
                name="consignorAddress"
                value={biltyForm.consignorAddress}
                onChange={updateBilty}
              />
            </div>

            <div className="field">
              <label>Consignor GSTIN</label>

              <input
                name="consignorGST"
                value={biltyForm.consignorGST}
                onChange={updateBilty}
              />
            </div>
          </div>

          <div className="sectionTitle">
            CONSIGNEE — RECEIVER / लेने वाला
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Select C/NEE *</label>

              <select
                value={biltyForm.consigneeId}
                onChange={(e) =>
                  selectConsignee(e.target.value)
                }
              >
                <option value="">
                  Select Consignee
                </option>

                {consignees.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} —{" "}
                    {customerRoleLabel(
                      item.partyType
                    )}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Consignee Name</label>

              <input
                name="consignee"
                value={biltyForm.consignee}
                onChange={updateBilty}
              />
            </div>

            <div className="field full">
              <label>Consignee Address</label>

              <textarea
                name="consigneeAddress"
                value={biltyForm.consigneeAddress}
                onChange={updateBilty}
              />
            </div>

            <div className="field">
              <label>Consignee GSTIN</label>

              <input
                name="consigneeGST"
                value={biltyForm.consigneeGST}
                onChange={updateBilty}
              />
            </div>
          </div>

          <div className="sectionTitle">
            ROUTE & VEHICLE
          </div>

          <div className="formGrid">
            <div className="field">
              <label>From / Pickup</label>

              <input
                name="pickup"
                value={biltyForm.pickup}
                onChange={updateBilty}
                placeholder="Delhi"
              />
            </div>

            <div className="field">
              <label>To / Delivery</label>

              <input
                name="delivery"
                value={biltyForm.delivery}
                onChange={updateBilty}
                placeholder="Bangalore"
              />
            </div>

            <div className="field">
              <label>Select Vehicle *</label>

              <select
                value={biltyForm.vehicleId}
                onChange={(e) =>
                  selectVehicle(e.target.value)
                }
              >
                <option value="">
                  Select Vehicle
                </option>

                {vehicles
                  .filter(
                    (item) =>
                      item.status === "Active"
                  )
                  .map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.vehicleNo} —{" "}
                      {item.vehicleType}
                    </option>
                  ))}
              </select>
            </div>

            <div className="field">
              <label>Vehicle Type</label>

              <input
                name="vehicleType"
                value={biltyForm.vehicleType}
                onChange={updateBilty}
              />
            </div>

            <div className="field">
              <label>Driver Name</label>

              <input
                name="driver"
                value={biltyForm.driver}
                onChange={updateBilty}
              />
            </div>

            <div className="field">
              <label>Driver Mobile</label>

              <input
                name="driverMobile"
                value={biltyForm.driverMobile}
                onChange={updateBilty}
              />
            </div>
          </div>

          <div className="sectionTitle">
            MATERIAL / WEIGHT / BOOKING FREIGHT
          </div>

          <div className="formGrid">
            <div className="field full">
              <label>Material / Description *</label>

              <input
                name="material"
                value={biltyForm.material}
                onChange={updateBilty}
                placeholder="Solar Material"
              />
            </div>

            <div className="field">
              <label>Actual Weight (KG) *</label>

              <input
                type="number"
                name="actualWeight"
                value={biltyForm.actualWeight}
                onChange={updateBilty}
                placeholder="18500"
              />
            </div>

            <div className="field">
              <label>Charge Weight (KG) *</label>

              <input
                type="number"
                name="chargeWeight"
                value={biltyForm.chargeWeight}
                onChange={updateBilty}
                placeholder="20000"
              />
            </div>

            <div className="field">
              <label>BOOKING FREIGHT (₹)</label>

              <input
                type="number"
                name="freight"
                value={biltyForm.freight}
                onChange={updateBilty}
                placeholder="85000"
              />
            </div>

            <div className="field">
              <label>Advance (₹)</label>

              <input
                type="number"
                name="advance"
                value={biltyForm.advance}
                onChange={updateBilty}
                placeholder="20000"
              />
            </div>
          </div>

          <div className="sectionTitle">
            DELIVERY DETAILS
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Loading Date</label>

              <input
                type="date"
                name="loadingDate"
                value={biltyForm.loadingDate}
                onChange={updateBilty}
              />
            </div>

            <div className="field">
              <label>Expected Delivery</label>

              <input
                type="date"
                name="expectedDelivery"
                value={biltyForm.expectedDelivery}
                onChange={updateBilty}
              />
            </div>

            <div className="field">
              <label>Status</label>

              <select
                name="status"
                value={biltyForm.status}
                onChange={updateBilty}
              >
                <option>Booked</option>
                <option>Loaded</option>
                <option>In Transit</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            </div>

            <div className="field full">
              <label>Remarks / Special Instructions</label>

              <textarea
                name="remarks"
                value={biltyForm.remarks}
                onChange={updateBilty}
              />
            </div>
          </div>

          <div className="formButtons">
            {editingBilty && (
              <button
                className="grayBtn"
                onClick={() => {
                  setEditingBilty(null);
                  setBiltyForm(createEmptyBilty());
                }}
              >
                CANCEL
              </button>
            )}

                      <div className="sectionTitle">🚚 E-WAY BILL & MATERIAL VALUE</div>

<div className="formGrid">
  <div className="field">
    <label>Material Value (₹)</label>
    <input
      type="number"
      name="materialValue"
      value={biltyForm.materialValue || ""}
      onChange={updateBilty}
      placeholder="e.g., 500000"
    />
  </div>
</div>

{/* 🔥 MULTI E-WAY BILL */}
<div className="sectionTitle" style={{ background: '#c62828', color: 'white', marginTop: '10px' }}>
  📄 MULTI E-WAY BILL
</div>

<div className="formGrid">
  <div className="field full">
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
      <strong>E-Way Bill Details</strong>
      <button
        type="button"
        className="blueBtn"
        onClick={() => {
          setBiltyForm(prev => ({
            ...prev,
            ewayBills: [...(prev.ewayBills || []), { no: "", expiry: "" }]
          }));
        }}
        style={{ padding: '4px 12px', fontSize: '12px' }}
      >
        + ADD E-WAY BILL
      </button>
    </div>

    {(biltyForm.ewayBills || []).map((item, index) => (
      <div key={index} style={{ 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center',
        marginBottom: '8px',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        background: '#f9f9f9'
      }}>
        <div style={{ flex: 1 }}>
          <input
            value={item.no || ""}
            onChange={(e) => {
              const newEwayBills = [...(biltyForm.ewayBills || [])];
              newEwayBills[index] = { ...newEwayBills[index], no: e.target.value };
              setBiltyForm(prev => ({ ...prev, ewayBills: newEwayBills }));
            }}
            placeholder="E-Way Bill No."
            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <input
            type="date"
            value={item.expiry || ""}
            onChange={(e) => {
              const newEwayBills = [...(biltyForm.ewayBills || [])];
              newEwayBills[index] = { ...newEwayBills[index], expiry: e.target.value };
              setBiltyForm(prev => ({ ...prev, ewayBills: newEwayBills }));
            }}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button
          type="button"
          className="deleteBtn"
          onClick={() => {
            setBiltyForm(prev => ({
              ...prev,
              ewayBills: (prev.ewayBills || []).filter((_, i) => i !== index)
            }));
          }}
          style={{ padding: '4px 10px', fontSize: '12px' }}
        >
          ✕
        </button>
      </div>
    ))}
    
    <small style={{ color: '#666', fontSize: '11px' }}>
      💡 Multiple E-Way Bills add kar sakte hain (e.g., different vehicles ke liye)
    </small>
  </div>
</div>

            <button
              className="greenBtn"
              onClick={saveBilty}
            >
              {editingBilty
                ? "UPDATE BILTY"
                : "SAVE BILTY"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="listHeader">
            <div>
              <h2>Bilty List</h2>
              <p>Total: {bilties.length}</p>
            </div>

            <input
              className="search"
              placeholder="Search Bilty / Party / Vehicle..."
              value={biltySearch}
              onChange={(e) =>
                setBiltySearch(e.target.value)
              }
            />
          </div>

          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>Bilty No.</th>
                  <th>Date</th>
                  <th>C/NOR</th>
                  <th>C/NEE</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Vehicle</th>
                  <th>Booking Freight</th>
                  <th>E-Way Bill</th>
                  <th>Material Value</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredBilties.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.bilty}</strong>
                    </td>

                    <td>{formatDate(item.date)}</td>

                    <td>{item.consignor}</td>

                    <td>{item.consignee}</td>

                    <td>{item.pickup}</td>

                    <td>{item.delivery}</td>

                    <td>{item.vehicle}</td>

                    <td>
                      ₹{money(item.freight)}
                    </td>
                     <td>
  {item.ewayBills && item.ewayBills.length > 0 ? (
    <div>
      {item.ewayBills.map((ewb, idx) => (
        <div key={idx} style={{ fontSize: '10px' }}>
          {ewb.no || "-"} 
          {ewb.expiry ? ` (${formatDate(ewb.expiry)})` : ""}
        </div>
      ))}
    </div>
  ) : (
    item.ewayBillNo || "-"
  )}
</td>
                    <td>₹{money(item.materialValue)}</td>

                    <td>
                      <button
                        className="editBtn"
                        onClick={() =>
                          editBilty(item)
                        }
                      >
                        EDIT
                      </button>

                      <button
                        className="printBtn"
                        onClick={() =>
                          setPrintBilty(item)
                        }
                      >
                        PRINT
                      </button>

                      <button
                        className="deleteBtn"
                        onClick={() =>
                          deleteBilty(item.id)
                        }
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBilties.length === 0 && (
              <div className="empty">
                No Bilty found.
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

// =========================================================
  // TRIP PAGE
  // =========================================================

  const renderTripPage = () => {
    const filteredTrips = trips.filter((item) =>
      `${item.tripNo} ${item.biltyNo} ${item.vehicleNo} ${item.brokerName} ${item.from} ${item.to} ${item.driverName}`
        .toLowerCase()
        .includes(tripSearch.toLowerCase())
    );

    const margin =
      Number(tripForm.bookingFreight || 0) -
      Number(tripForm.lorryFreight || 0);

    const marginPercent =
      Number(tripForm.bookingFreight || 0) > 0
        ? (margin / Number(tripForm.bookingFreight)) * 100
        : 0;

    return (
      <>
        <div className="pageTitle">
          <h2>
            {editingTrip ? "Edit LHC / Dispatch" : "LHC / Dispatch"}
          </h2>
          <p>Lorry Hire Charges, Advance, Balance & Margin</p>
        </div>

        <div className="tripHeader">
          <div>
            <h3>{editingTrip ? "Edit LHC" : "Create New LHC"}</h3>
          </div>
          <div className="tripNumberBox">
            <strong>LHC No: {tripForm.tripNo || "AUTO GENERATE"}</strong>
          </div>
        </div>

        <div className="card">
          <div className="sectionTitle">BILTY & BROKER</div>

          <div className="formGrid">
            <div className="field">
              <label>Select Bilty *</label>

              <select
  value={tripForm.biltyId}
  onChange={(e) => selectTripBilty(e.target.value)}
>
  <option value="">Select Bilty</option>
 {bilties
  .filter((item) => {
    // 🔥 SABHI TRIPS KI SAARI BILTY IDs (selectedBilties se bhi)
    const allTripBiltyIds = [];
  
  trips.forEach(trip => {
    // Edit mode me current trip ignore karo
    if (editingTrip && String(trip.id) === String(editingTrip.id)) return;
    
    // selectedBilties - DB me text/array dono ho sakta hai
    let tripSelectedBilties = trip.selectedBilties;
    
    // Agar string hai to parse karo
    if (typeof tripSelectedBilties === 'string') {
      try {
        tripSelectedBilties = JSON.parse(tripSelectedBilties);
      } catch (e) {
        tripSelectedBilties = [];
      }
    }
    
    // Agar array hai to saari IDs lo
    if (Array.isArray(tripSelectedBilties)) {
      tripSelectedBilties.forEach(bId => {
        allTripBiltyIds.push(String(bId));
      });
    }
    
    // biltyId bhi add karo (backup)
    if (trip.biltyId) {
      allTripBiltyIds.push(String(trip.biltyId));
    }
  });
  
  console.log("🔍 All trip bilty IDs:", allTripBiltyIds);
    
    // Current bilty ko hamesha show karo (edit mode me)
    const isCurrentBilty = String(item.id) === String(tripForm.biltyId);
    
    return isCurrentBilty || (
      !allTripBiltyIds.includes(String(item.id)) && 
      item.status !== "Delivered"
    );
  })
  .map((item) => (
    <option key={item.id} value={item.id}>
      {item.bilty} — {item.consignor} → {item.consignee}
    </option>
  ))}
</select>
            </div>

            <div className="field">
              <label>Bilty Number</label>

              <input
                value={tripForm.biltyNo}
                readOnly
              />
            </div>

            <div className="field">
              <label>Broker Name</label>

              <input
                name="brokerName"
                value={tripForm.brokerName}
                onChange={updateTrip}
                placeholder="Broker / Party Name"
              />
            </div>

            <div className="field">
              <label>Trip Date</label>

              <input
                type="date"
                name="tripDate"
                value={tripForm.tripDate}
                onChange={updateTrip}
              />
            </div>
          </div>
         {/* 🔥 YAHAN ADD KARO - BILTY & BROKER SECTION KE BAAD */}
{tripForm.pendingBilties && tripForm.pendingBilties.length > 1 && (
  <div className="sectionTitle">📦 MULTI BILTY SELECTION</div>
)}

{tripForm.pendingBilties && tripForm.pendingBilties.length > 1 && (
  <div className="formGrid">
    <div className="field full">
      <label>Select Multiple Biltiy for this Trip</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '6px' }}>
        {tripForm.pendingBilties.map((item) => (
          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={tripForm.selectedBilties?.includes(item.id)}
              onChange={(e) => {
                const checked = e.target.checked;
                setTripForm((prev) => {
                  const selected = prev.selectedBilties || [];
                  let newSelected;
                  if (checked) {
                    newSelected = [...selected, item.id];
                  } else {
                    newSelected = selected.filter(id => id !== item.id);
                  }
                  
                  // 🔥 TOTAL FREIGHT RECALCULATE
                  const totalFreight = bilties
                    .filter(b => newSelected.includes(b.id))
                    .reduce((sum, b) => sum + Number(b.freight || 0), 0);
                  
                  return { 
                    ...prev, 
                    selectedBilties: newSelected,
                    bookingFreight: totalFreight  // 🔥 UPDATE TOTAL
                  };
                });
              }}
            />
            <span>{item.bilty} - {item.consignor} → {item.consignee} (₹{money(item.freight)})</span>
          </label>
        ))}
      </div>
      <small style={{ color: '#666' }}>💡 Same vehicle ki multiple bilties select karein</small>
    </div>
  </div>
)}


          <div className="sectionTitle">
            VEHICLE & ROUTE
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Select Vehicle *</label>

              <select
                value={tripForm.vehicleId}
                onChange={(e) =>
                  selectTripVehicle(e.target.value)
                }
              >
                <option value="">
                  Select Vehicle
                </option>

                {vehicles
                  .filter(
                    (item) =>
                      item.status === "Active"
                  )
                  .map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.vehicleNo} —{" "}
                      {item.vehicleType}
                    </option>
                  ))}
              </select>
            </div>

            <div className="field">
              <label>Vehicle Number</label>

              <input
                value={tripForm.vehicleNo}
                readOnly
              />
            </div>

            <div className="field">
              <label>Vehicle Type</label>

              <input
                value={tripForm.vehicleType}
                readOnly
              />
            </div>

            <div className="field">
              <label>Driver Name</label>

              <input
                value={tripForm.driverName}
                readOnly
              />
            </div>

            <div className="field">
              <label>Driver Mobile</label>

              <input
                value={tripForm.driverMobile}
                readOnly
              />
            </div>

            <div className="field">
              <label>From</label>

              <input
                name="from"
                value={tripForm.from}
                onChange={updateTrip}
                placeholder="Delhi"
              />
            </div>

            <div className="field">
              <label>To</label>

              <input
                name="to"
                value={tripForm.to}
                onChange={updateTrip}
                placeholder="Bangalore"
              />
            </div>

            <div className="field">
              <label>Status</label>

              <select
                name="status"
                value={tripForm.status}
                onChange={updateTrip}
              >
                <option>DISPATCHED</option>
                <option>IN TRANSIT</option>
                <option>RECEIVED</option>
                <option>DELIVERED</option>
                <option>CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="sectionTitle">
            LORRY HIRE & FREIGHT
          </div>

          <div className="formGrid">
            <div className="field">
              <label>
                Booking Freight
              </label>

              <input
                value={`₹ ${money(
                  tripForm.bookingFreight
                )}`}
                readOnly
              />

              <small>
                Bilty se automatic aata hai
              </small>
            </div>

            <div className="field">
              <label>
                Lorry Freight / Hire *
              </label>

              <input
                type="number"
                name="lorryFreight"
                value={tripForm.lorryFreight}
                onChange={updateTrip}
                placeholder="65000"
              />
            </div>

            <div className="field">
              <label>Advance Paid</label>

              <input
                type="number"
                name="advance"
                value={tripForm.advance}
                onChange={updateTrip}
                placeholder="20000"
              />
            </div>

            <div className="field">
              <label>Current Lorry Balance</label>

              <input
                value={`₹ ${money(
                  tripTotals.lorryFreight -
                    tripTotals.advance
                )}`}
                readOnly
              />
            </div>
          </div>

          <div className="marginBox">
            <div>
              <span>BOOKING FREIGHT</span>
              <strong>
                ₹{money(tripTotals.bookingFreight)}
              </strong>
            </div>

            <div>
              <span>LORRY FREIGHT</span>
              <strong>
                ₹{money(tripTotals.lorryFreight)}
              </strong>
            </div>

            <div>
              <span>ESTIMATED MARGIN</span>
              <strong>
                ₹{money(tripTotals.margin)}
              </strong>
            </div>

            <div>
              <span>MARGIN %</span>
              <strong>
                {tripTotals.marginPercent.toFixed(2)}%
              </strong>
            </div>
          </div>

          <div className="sectionTitle">
            RECEIVED / LORRY HIRE BALANCE
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Received Date</label>

              <input
                type="date"
                name="receivedDate"
                value={tripForm.receivedDate}
                onChange={updateTrip}
              />
            </div>

            <div className="field">
              <label>Lorry Hire Balance</label>

              <input
                value={`₹ ${money(
                  tripTotals.balance
                )}`}
                readOnly
              />
            </div>
          </div>

          <div className="sectionTitle">
            DAMAGE / HALTING / OTHER ADJUSTMENTS
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Damage Addition</label>

              <input
                type="number"
                name="damageAddition"
                value={tripForm.damageAddition}
                onChange={updateTrip}
                placeholder="0"
              />
            </div>

            <div className="field">
              <label>Damage Deduction</label>

              <input
                type="number"
                name="damageDeduction"
                value={tripForm.damageDeduction}
                onChange={updateTrip}
                placeholder="0"
              />
            </div>

            <div className="field">
              <label>Halting Addition</label>

              <input
                type="number"
                name="haltingAddition"
                value={tripForm.haltingAddition}
                onChange={updateTrip}
                placeholder="0"
              />
            </div>

            <div className="field">
              <label>Halting Deduction</label>

              <input
                type="number"
                name="haltingDeduction"
                value={tripForm.haltingDeduction}
                onChange={updateTrip}
                placeholder="0"
              />
            </div>

            <div className="field">
              <label>Other Addition</label>

              <input
                type="number"
                name="otherAddition"
                value={tripForm.otherAddition}
                onChange={updateTrip}
                placeholder="0"
              />
            </div>

            <div className="field">
              <label>Other Deduction</label>

              <input
                type="number"
                name="otherDeduction"
                value={tripForm.otherDeduction}
                onChange={updateTrip}
                placeholder="0"
              />
            </div>
          </div>

          <div className="adjustmentSummary">
            <div>
              <span>Total Addition</span>
              <strong>
                ₹{money(tripTotals.additions)}
              </strong>
            </div>

            <div>
              <span>Total Deduction</span>
              <strong>
                ₹{money(tripTotals.deductions)}
              </strong>
            </div>

            <div>
              <span>Final Lorry Hire</span>
              <strong>
                ₹{money(
                  tripTotals.adjustedLorryHire
                )}
              </strong>
            </div>

            <div>
              <span>Final Balance</span>
              <strong>
                ₹{money(
                  tripTotals.adjustedLorryHire -
                    tripTotals.advance
                )}
              </strong>
            </div>
          </div>

          <div className="sectionTitle">
            CLAIM MANAGEMENT
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Claim Amount</label>

              <input
                type="number"
                name="claimAmount"
                value={tripForm.claimAmount}
                onChange={updateTrip}
                placeholder="0"
              />
            </div>

            <div className="field full">
              <label>Claim Reason / Damage Details</label>

              <textarea
                name="claimReason"
                value={tripForm.claimReason}
                onChange={updateTrip}
                placeholder="Complete damage / material damage / shortage details..."
              />
            </div>

            <div className="field full">
              <label>Trip Remarks</label>

              <textarea
                name="remarks"
                value={tripForm.remarks}
                onChange={updateTrip}
                placeholder="Any special instruction..."
              />
            </div>
          </div>

          <div className="formButtons">
            {editingTrip && (
              <button
                className="grayBtn"
                onClick={() => {
                  setEditingTrip(null);
                  setTripForm(createEmptyTrip());
                }}
              >
                CANCEL
              </button>
            )}

            <button
              className="greenBtn"
              onClick={saveTrip}
            >
              {editingTrip
                ? "UPDATE TRIP"
                : "SAVE TRIP / DISPATCH"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="listHeader">
            <div>
              <h2>LHC / Dispatch List</h2>
              <p>Total: {trips.length}</p>
            </div>

            <input
              className="search"
              placeholder="Search Trip / Bilty / Vehicle / Broker..."
              value={tripSearch}
              onChange={(e) =>
                setTripSearch(e.target.value)
              }
            />
          </div>

          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>LHC No.</th>
                  <th>Bilty</th>
                  <th>Broker</th>
                  <th>Vehicle</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Lorry Freight</th>
                  <th>Advance</th>
                  <th>Balance</th>
                  <th>Margin %</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTrips.map((item) => {
                  const booking = Number(
                    item.bookingFreight || 0
                  );

                  const hire = Number(
                    item.lorryFreight || 0
                  );

                  const advance = Number(
                    item.advance || 0
                  );

                  const margin = booking - hire;

                  const percentage =
                    booking > 0
                      ? (margin / booking) * 100
                      : 0;

                  const finalBalance =
                    hire +
                    Number(item.damageAddition || 0) +
                    Number(item.haltingAddition || 0) +
                    Number(item.otherAddition || 0) -
                    Number(item.damageDeduction || 0) -
                    Number(item.haltingDeduction || 0) -
                    Number(item.otherDeduction || 0) -
                    advance;

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.tripNo}</strong>
                      </td>
        <td>
          {Array.isArray(item.selectedBilties) && item.selectedBilties.length > 1 ? (
            <div>
              {item.selectedBilties.map((bId, idx) => {
                const b = bilties.find(x => String(x.id) === String(bId));
                return b ? (
                  <div key={idx} style={{ fontSize: '11px', lineHeight: '1.4' }}>
                    • {b.bilty}
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            item.biltyNo
          )}
        </td>

                      <td>
                        {item.brokerName || "-"}
                      </td>

                      <td>{item.vehicleNo}</td>

                      <td>{item.from}</td>

                      <td>{item.to}</td>

                      <td>₹{money(hire)}</td>

                      <td>₹{money(advance)}</td>

                      <td>
                        ₹{money(finalBalance)}
                      </td>

                      <td>
                        <strong>
                          {percentage.toFixed(2)}%
                        </strong>
                      </td>

                      <td>
                        <span className="statusActive">
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="editBtn"
                          onClick={() =>
                            editTrip(item)
                          }
                        >
                          EDIT
                        </button>

                        <button
                          className="printBtn"
                          onClick={() =>
                            setPrintTrip(item)
                          }
                        >
                          PRINT
                        </button>

                        <button
                          className="deleteBtn"
                          onClick={() =>
                            deleteTrip(item.id)
                          }
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredTrips.length === 0 && (
              <div className="empty">
                No Trip found.
              </div>
            )}
          </div>
        </div>
      </>
    );
  };
      // =========================================================
  // LORRY HIRE BALANCE PAGE
  // =========================================================

  const renderLHBalancePage = () => {
  const filteredTripsLHB = trips.filter((item) => {
  // 1. Search match
  const searchMatch = 
    `${item.tripNo} ${item.biltyNo} ${item.vehicleNo} ${item.brokerName} ${item.from} ${item.to}`
      .toLowerCase()
      .includes(lhbSearch.toLowerCase());

  if (!searchMatch) return false;

  // 2. 🔥 Already paid check
  const lhbPaid = Number(item.lhbPaid || 0);
  const lhbCash = Number(item.lhbCash || 0);
  const lhbBank = Number(item.lhbBank || 0);
  const lhbOther = Number(item.lhbOther || 0);
  const totalPaid = lhbPaid || (lhbCash + lhbBank + lhbOther);
  const isLHBUpdated = !!item.lhbUpdatedAt;

  // Agar already entry ho chuki hai toh list se hata do
  if (totalPaid > 0 || isLHBUpdated) return false;

  return true;
});

  const handleSelectTrip = (tripId) => {
    const trip = trips.find((item) => String(item.id) === String(tripId));
    if (!trip) {
      setLhbTrip(null);
      return;
    }
    setLhbTrip(trip);
    setLhbPayTo(trip.brokerName ? "BROKER" : "OWNER");
    setLhbHalting(Number(trip.haltingAddition || 0) + Number(trip.haltingDeduction || 0));
    setLhbDamage(Number(trip.damageAddition || 0) + Number(trip.damageDeduction || 0));
    setLhbCash(0);
    setLhbBank(0);
    setLhbOther(0);
    setLhbRemarks("");
  };

  const handleSaveBalance = async () => {
  console.log("🚀 SAVE LHB STARTED");
  
  if (!lhbTrip) {
    alert("Please select a Trip first.");
    return;
  }

  // =====================================================
  // 🔥 DUPLICATE CHECK
  // =====================================================
  const originalTrip = trips.find(t => String(t.id) === String(lhbTrip.id));
  
  if (originalTrip) {
    const alreadyPaid = Number(originalTrip.lhbPaid || 0);
    const alreadyCash = Number(originalTrip.lhbCash || 0);
    const alreadyBank = Number(originalTrip.lhbBank || 0);
    const alreadyOther = Number(originalTrip.lhbOther || 0);
    const alreadyTotalPaid = alreadyPaid || (alreadyCash + alreadyBank + alreadyOther);

    if (alreadyTotalPaid > 0 || originalTrip.lhbUpdatedAt) {
      const proceed = window.confirm(
        `⚠️ WARNING!\n\n` +
        `Is Trip (${originalTrip.tripNo}) ki LHB entry ALREADY ho chuki hai.\n\n` +
        `Already Paid: ₹${alreadyTotalPaid}\n\n` +
        `Kya aap dobara update karna chahte hain?`
      );
      
      if (!proceed) return;
    }
  }

  const totalPayment = lhbPaidTotal();

  const updatedTrip = {
    ...lhbTrip,
    lhbPayTo: lhbPayTo || "BROKER",
    lhbHalting: String(lhbHalting || 0),
    lhbDamage: String(lhbDamage || 0),
    lhbCash: String(lhbCash || 0),
    lhbBank: String(lhbBank || 0),
    lhbOther: String(lhbOther || 0),
    // 🔥 Challan & Bilty Deduction (margin mein add hoga)
    challanBiltyDeduction: String(lhbOther || 0),
    lhbRemarks: lhbRemarks || "",
    lhbPaid: String(totalPayment),
    lhbPending: String(lhbCurrentTotal() - totalPayment),
    lhbUpdatedAt: new Date().toISOString()
  };

  try {
    let { error } = await supabase
      .from('trips')
      .update(updatedTrip)
      .eq('id', lhbTrip.id);
    
    if (error) throw error;
    
    alert("✅ Lorry Hire Balance updated successfully!");
    setLhbTrip(null);
    setLhbSearch("");
    setLhbHalting(0);
    setLhbDamage(0);
    setLhbCash(0);
    setLhbBank(0);
    setLhbOther(0);
    setLhbRemarks("");
    await loadAllData();
  } catch (e) {
    alert("❌ Error: " + e.message);
  }
};

  return (
    <>
      <div className="pageTitle" style={{
        background: 'linear-gradient(135deg, #102a43 0%, #1a3a5c 100%)',
        padding: '25px 30px',
        borderRadius: '10px',
        color: 'white',
        marginBottom: '25px'
      }}>
        <div>
          <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>💰 Lorry Hire Balance (LHB)</h2>
          <p style={{ color: '#b8d4e8', margin: '5px 0 0', fontSize: '13px' }}>
            Trip / LHC number se Balance Pay karo, Broker / Owner select karo
          </p>
        </div>
      </div>

      {/* SEARCH TRIP SECTION */}
      <div className="card" style={{ padding: '20px' }}>
        <div className="inputButton">
          <input
            type="text"
            value={lhbSearch}
            onChange={(e) => setLhbSearch(e.target.value)}
            placeholder="🔍 Trip / LHC Number, Bilty No, Vehicle No search karo"
            style={{ flex: 1, padding: '14px 16px', fontSize: '16px', border: '2px solid #dfe6ed', borderRadius: '8px' }}
          />
        </div>

        <div className="tableWrapper" style={{ marginTop: '15px' }}>
          <table>
            <thead>
              <tr>
                <th>Trip No.</th>
                <th>Bilty No.</th>
                <th>Vehicle</th>
                <th>Broker / Owner</th>
                <th>Lorry Freight</th>
                <th>Advance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTripsLHB.map((item) => {
                const hire = Number(item.lorryFreight || 0);
                const advance = Number(item.advance || 0);
                const balance = hire - advance;
                return (
                  <tr key={item.id}>
                    <td><strong>{item.tripNo}</strong></td>
                    <td>{item.biltyNo}</td>
                    <td>{item.vehicleNo}</td>
                    <td>{item.brokerName || item.ownerName || "-"}</td>
                    <td>₹{money(hire)}</td>
                    <td>₹{money(advance)}</td>
                    <td>{item.status}</td>
                    <td>
                      <button
                        className="blueBtn"
                        onClick={() => handleSelectTrip(item.id)}
                      >
                        💰 BALANCE
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTripsLHB.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty">Koi Trip nahi mila.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELECTED TRIP DETAILS */}
      {lhbTrip && (
        <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
          <h3 style={{ color: '#102a43' }}>💰 Trip Details: {lhbTrip.tripNo}</h3>

          <div className="marginBox">
            <div>
              <span>Lorry Freight</span>
              <strong>₹{money(lhbTrip.lorryFreight)}</strong>
            </div>
            <div>
              <span>Advance Paid</span>
              <strong>₹{money(lhbTrip.advance)}</strong>
            </div>
            <div>
              <span>Total Balance</span>
              <strong>₹{money(Number(lhbTrip.lorryFreight || 0) - Number(lhbTrip.advance || 0))}</strong>
            </div>
          </div>

          {/* PAY TO SELECTION */}
          <div className="sectionTitle">PAY TO (BROKER / OWNER)</div>
          <div className="formGrid">
            <div className="field">
              <label>Payment Kisko Karna Hai?</label>
              <select
                value={lhbPayTo}
                onChange={(e) => setLhbPayTo(e.target.value)}
              >
                <option value="BROKER">BROKER (Broker Name: {lhbTrip.brokerName || "-"})</option>
                <option value="OWNER">OWNER (Owner Name: {lhbTrip.ownerName || "-"})</option>
              </select>
            </div>
          </div>

          {/* ADJUSTMENTS */}
          <div className="sectionTitle">ADJUSTMENTS (HALTING & DAMAGE)</div>
          <div className="formGrid">
            <div className="field">
              <label>Halting Addition (+)</label>
              <input
                type="number"
                value={lhbHalting}
                onChange={(e) => setLhbHalting(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>Damage Deduction (-)</label>
              <input
                type="number"
                value={lhbDamage}
                onChange={(e) => setLhbDamage(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* SPLIT PAYMENT */}
          <div className="sectionTitle">PAYMENT MODE (SPLIT PAYMENT)</div>
          <div className="formGrid">
            <div className="field">
              <label>Cash Amount (₹)</label>
              <input
                type="number"
                value={lhbCash}
                onChange={(e) => setLhbCash(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>NEFT / Bank Transfer (₹)</label>
              <input
                type="number"
                value={lhbBank}
                onChange={(e) => setLhbBank(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field">
  <label>Challan & Bilty Deduction (₹)</label>
  <input
    type="number"
    value={lhbOther}
    onChange={(e) => setLhbOther(e.target.value)}
    placeholder="0"
  />
</div>
            <div className="field full">
              <label>Remarks</label>
              <textarea
                value={lhbRemarks}
                onChange={(e) => setLhbRemarks(e.target.value)}
                placeholder="Payment remarks"
              />
            </div>
          </div>

          {/* FINAL CALCULATION */}
          <div className="marginBox" style={{ marginTop: '15px' }}>
            <div>
              <span>Current Balance</span>
              <strong>₹{money(lhbCurrentTotal())}</strong>
            </div>
            <div>
              <span>Cash Paid</span>
              <strong>₹{money(lhbCash)}</strong>
            </div>
            <div>
              <span>NEFT Paid</span>
              <strong>₹{money(lhbBank)}</strong>
            </div>
                        <div>
              <span>Challan & Bilty Deduction</span>
              <strong>₹{money(lhbOther)}</strong>
            </div>
            <div>
              <span>Total Paid</span>
              <strong>₹{money(lhbPaidTotal())}</strong>
            </div>
            <div>
              <span>Pending Balance</span>
              <strong style={{ color: '#c62828' }}>₹{money(lhbPending())}</strong>
            </div>
          </div>

          <div className="formButtons">
            <button
              className="blueBtn"
              onClick={() => {
                setLhbTrip(null);
                setLhbSearch("");
                setLhbHalting(0);
                setLhbDamage(0);
                setLhbCash(0);
                setLhbBank(0);
                setLhbOther(0);
                setLhbRemarks("");
              }}
            >
              RESET
            </button>
            <button className="greenBtn" onClick={handleSaveBalance}>
              ✅ SAVE BALANCE
            </button>
          </div>
        </div>
      )}
    </>
  );
};

    // =========================================================
  // POD / DELIVERY MANAGEMENT - FUNCTIONS
  // =========================================================

  const updatePOD = (e) => {
    const { name, value } = e.target;

    setPodForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // =========================================================
  // SELECT TRIP FOR POD
  // =========================================================

  const selectPODTrip = (tripId) => {
    const trip = trips.find(
      (item) => String(item.id) === String(tripId)
    );

    if (!trip) {
      setPodForm(createEmptyPOD());
      return;
    }

    const linkedBilty = bilties.find(
      (item) =>
        String(item.id) === String(trip.biltyId)
    );

    setPodForm((prev) => ({
      ...prev,

      tripId: trip.id,
      tripNo: trip.tripNo || "",
      biltyNo: trip.biltyNo || "",

      vehicleNo: trip.vehicleNo || "",
      vehicleType: trip.vehicleType || "",
      driverName: trip.driverName || "",
      driverMobile: trip.driverMobile || "",

      consignor:
        linkedBilty?.consignor ||
        trip.consignor ||
        "",

      consignee:
        linkedBilty?.consignee ||
        trip.consignee ||
        "",

      from: trip.from || "",
      to: trip.to || "",

      dispatchDate:
        trip.tripDate ||
        linkedBilty?.loadingDate ||
        "",

      status:
        trip.status === "DELIVERED"
          ? "DELIVERED"
          : "IN TRANSIT",
    }));
  };


  // =========================================================
  // SAVE POD
  // =========================================================

   const savePOD = async () => {
  if (!podForm.tripId) {
    alert("Please select Trip.");
    return;
  }
  if (!podForm.podNo.trim()) {
    alert("Please enter POD Number.");
    return;
  }
  if (!podForm.deliveryDate) {
    alert("Please enter Delivery Date.");
    return;
  }

  const podData = {
    ...podForm,
    shortageAmount: Number(podForm.shortageAmount || 0),
    damageAmount: Number(podForm.damageAmount || 0),
    claimAmount: Number(podForm.claimAmount || 0),
    // FRONT SIDE
    documentName: podForm.documentName || "",
    documentType: podForm.documentType || "",
    documentData: podForm.documentData || "",
    // 🆕 BACK SIDE
    documentNameBack: podForm.documentNameBack || "",
    documentTypeBack: podForm.documentTypeBack || "",
    documentDataBack: podForm.documentDataBack || "",
  };

  try {
    if (editingPOD) {
      let { error } = await supabase.from('pods').update(podData).eq('id', editingPOD);
      if (!error) {
        setEditingPOD(null);
        setPodForm(createEmptyPOD());
        alert("POD updated successfully.");
      }
    } else {
      let { error } = await supabase.from('pods').insert([podData]);
      if (!error) {
        setPodForm(createEmptyPOD());
        alert("POD saved successfully.");
      }
    }
    loadAllData();
  } catch (e) {
    alert("❌ Error: " + e.message);
  }
};
  // =========================================================
  // DELETE POD
  // =========================================================

    const deletePOD = async (id) => {
    if (!window.confirm("Are you sure you want to delete this POD?")) return;
    try {
      let { error } = await supabase.from('pods').delete().eq('id', id);
      if (!error) {
        loadAllData();
      }
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
  };

  // =========================================================
  // VIEW POD DOCUMENT
  // =========================================================

  const viewPODDocument = (item, side = 'front') => {
  let documentData, documentName;
  
  if (side === 'front') {
    documentData = item.documentData;
    documentName = item.documentName || "Front Side";
  } else {
    documentData = item.documentDataBack;
    documentName = item.documentNameBack || "Back Side";
  }
  
  if (!documentData) {
    alert(`Is POD ki ${side} side upload nahi hai.`);
    return;
  }

  const newWindow = window.open();
  if (!newWindow) {
    alert("Popup blocked hai. Please browser mein popup allow karein.");
    return;
  }

  // Check if it's an image
  if (item.documentType && item.documentType.startsWith("image/")) {
    newWindow.document.write(`
      <html>
        <head>
          <title>${documentName}</title>
        </head>
        <body style="margin:0; padding:20px; background:#f3f4f6; text-align:center;">
          <h2>${documentName}</h2>
          <img src="${documentData}" style="max-width:100%; max-height:90vh; object-fit:contain;" />
        </body>
      </html>
    `);
  } else {
    newWindow.document.write(`
      <html>
        <head>
          <title>${documentName}</title>
        </head>
        <body style="margin:0;">
          <iframe src="${documentData}" style="width:100%; height:100vh; border:none;"></iframe>
        </body>
      </html>
    `);
  }
  newWindow.document.close();
};

  // =========================================================
  // GENERATE POD NUMBER
  // =========================================================

  const getNextPODNumber = () => {
    const year = new Date().getFullYear();

    return `POD-${year}-${String(
      pods.length + 1
    ).padStart(5, "0")}`;
  };
  // =========================================================
  // POD / DELIVERY PAGE
  // =========================================================

  const renderPODPage = () => {
  // =====================================================
  // DEVICE DETECTION
  // =====================================================
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
  
  const filteredPODs = pods.filter((item) =>
    `
      ${item.podNo}
      ${item.tripNo}
      ${item.biltyNo}
      ${item.vehicleNo}
      ${item.driverName}
      ${item.consignor}
      ${item.consignee}
      ${item.from}
      ${item.to}
      ${item.status}
    `
      .toLowerCase()
      .includes(podSearch.toLowerCase())
  );

  // =====================================================
  // BILTY SEARCH FUNCTION
  // =====================================================
  const searchBiltyForPOD = (biltyNo) => {
    if (!biltyNo.trim()) {
      setPodForm(prev => ({
        ...prev,
        biltyNo: "",
        from: "",
        to: "",
        consignor: "",
        consignee: "",
        vehicleNo: "",
        driverName: "",
        driverMobile: "",
        tripNo: "",
        tripId: ""
      }));
      return;
    }

    const foundBilty = bilties.find(
      (item) => String(item.bilty || "").trim().toUpperCase() === String(biltyNo).trim().toUpperCase()
    );

    if (!foundBilty) {
      alert("❌ Bilty number not found! Please check.");
      return;
    }

    const foundTrip = trips.find(
      (item) => String(item.biltyId) === String(foundBilty.id)
    );

    setPodForm(prev => ({
      ...prev,
      biltyNo: foundBilty.bilty,
      from: foundBilty.pickup || "",
      to: foundBilty.delivery || "",
      consignor: foundBilty.consignor || "",
      consignee: foundBilty.consignee || "",
      vehicleNo: foundTrip?.vehicleNo || foundBilty.vehicle || "",
      driverName: foundTrip?.driverName || foundBilty.driver || "",
      driverMobile: foundTrip?.driverMobile || foundBilty.driverMobile || "",
      tripNo: foundTrip?.tripNo || "",
      tripId: foundTrip?.id || "",
      dispatchDate: foundTrip?.tripDate || foundBilty.loadingDate || "",
    }));

    alert(`✅ Bilty ${foundBilty.bilty} found! From: ${foundBilty.pickup} → To: ${foundBilty.delivery}`);
  };

  // =====================================================
  // CAPTURE FROM CAMERA
  // =====================================================
  const captureFromCamera = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      alert("❌ Could not capture image. Please try again.");
      return;
    }

    if (cameraSide === 'front') {
      setPodForm(prev => ({
        ...prev,
        documentName: `Front_${Date.now()}.jpg`,
        documentType: "image/jpeg",
        documentData: imageSrc
      }));
    } else {
      setPodForm(prev => ({
        ...prev,
        documentNameBack: `Back_${Date.now()}.jpg`,
        documentTypeBack: "image/jpeg",
        documentDataBack: imageSrc
      }));
    }
    setShowCamera(false);
    alert(`✅ ${cameraSide === 'front' ? 'Front' : 'Back'} side captured successfully!`);
  };

  return (
    <>
      {/* =====================================================
          CAMERA MODAL (Only on Mobile)
      ===================================================== */}
      {showCamera && isMobile && (
        <div className="printOverlay" onClick={() => setShowCamera(false)}>
          <div 
            className="printDocument" 
            style={{ 
              maxWidth: '500px', 
              margin: '50px auto', 
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 10px 0', color: '#102a43' }}>
              📸 Scan {cameraSide === 'front' ? 'Front' : 'Back'} Side
            </h2>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>
              {cameraSide === 'front' ? 'Front side' : 'Back side'} of POD document
            </p>
            
            <div style={{ 
              background: '#000', 
              borderRadius: '8px', 
              overflow: 'hidden',
              marginBottom: '15px'
            }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: 'environment'
                }}
                style={{ width: '100%', height: 'auto' }}
                onUserMediaError={(e) => {
                  alert("❌ Camera access denied! Please allow camera permission.");
                  setShowCamera(false);
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="grayBtn"
                onClick={() => setShowCamera(false)}
                style={{ padding: '12px 24px' }}
              >
                ❌ CANCEL
              </button>
              <button
                className="greenBtn"
                onClick={captureFromCamera}
                style={{ padding: '12px 24px' }}
              >
                📸 CAPTURE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <div className="pageTitle">
        <h2>{editingPOD ? "Edit POD / Delivery" : "POD / Delivery Management"}</h2>
        <p>
          {isMobile ? '📱 Scan & Upload' : '💻 Upload'} — Bilty number search → Auto fill → {isMobile ? 'Scan' : 'Upload'}
        </p>
      </div>

      {/* =====================================================
          POD FORM
      ===================================================== */}
      <div className="card">
        <div className="tripHeader">
          <div>
            <h3>{editingPOD ? "Edit POD" : "Create POD / Delivery"}</h3>
          </div>
          <div className="tripNumberBox">
            <strong>POD No: {podForm.podNo || getNextPODNumber()}</strong>
          </div>
        </div>

        {/* =====================================================
            BILTY SEARCH
        ===================================================== */}
        <div className="sectionTitle" style={{ background: '#1769aa', color: 'white', padding: '10px 15px', borderRadius: '6px' }}>
          🔍 SEARCH BILTY NUMBER
        </div>

        <div className="formGrid">
          <div className="field">
            <label>Bilty Number *</label>
            <div className="inputButton">
              <input
                type="text"
                value={podForm.biltyNo}
                onChange={(e) => {
                  setPodForm(prev => ({ ...prev, biltyNo: e.target.value }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchBiltyForPOD(podForm.biltyNo);
                  }
                }}
                placeholder="Type Bilty No. and press Enter"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="blueBtn"
                onClick={() => searchBiltyForPOD(podForm.biltyNo)}
                style={{ whiteSpace: 'nowrap' }}
              >
                🔍 SEARCH
              </button>
            </div>
            <small style={{ color: '#666', fontSize: '11px' }}>
              💡 Bilty number dalo aur Enter press karo — From, To, Consignor, Vehicle sab auto fill ho jayega!
            </small>
          </div>
        </div>

        {/* =====================================================
            AUTO-FILLED DETAILS
        ===================================================== */}
        <div className="sectionTitle">📋 ROUTE & PARTY DETAILS</div>

        <div className="formGrid">
          <div className="field">
            <label>Trip No.</label>
            <input value={podForm.tripNo} readOnly style={{ background: '#f0f0f0' }} />
          </div>
          <div className="field">
            <label>From</label>
            <input value={podForm.from} readOnly style={{ background: '#f0f0f0' }} />
          </div>
          <div className="field">
            <label>To</label>
            <input value={podForm.to} readOnly style={{ background: '#f0f0f0' }} />
          </div>
          <div className="field">
            <label>Consignor</label>
            <input value={podForm.consignor} readOnly style={{ background: '#f0f0f0' }} />
          </div>
          <div className="field">
            <label>Consignee</label>
            <input value={podForm.consignee} readOnly style={{ background: '#f0f0f0' }} />
          </div>
          <div className="field">
            <label>Vehicle No.</label>
            <input value={podForm.vehicleNo} readOnly style={{ background: '#f0f0f0' }} />
          </div>
          <div className="field">
            <label>Driver Name</label>
            <input value={podForm.driverName} readOnly style={{ background: '#f0f0f0' }} />
          </div>
          <div className="field">
            <label>Driver Mobile</label>
            <input value={podForm.driverMobile} readOnly style={{ background: '#f0f0f0' }} />
          </div>
        </div>

        {/* =====================================================
            DELIVERY DETAILS
        ===================================================== */}
        <div className="sectionTitle">📦 DELIVERY DETAILS</div>

        <div className="formGrid">
          <div className="field">
            <label>Dispatch Date</label>
            <input
              type="date"
              name="dispatchDate"
              value={podForm.dispatchDate}
              onChange={updatePOD}
            />
          </div>
          <div className="field">
            <label>Delivery Date *</label>
            <input
              type="date"
              name="deliveryDate"
              value={podForm.deliveryDate}
              onChange={updatePOD}
            />
          </div>
          <div className="field">
            <label>POD Number</label>
            <input
              name="podNo"
              value={podForm.podNo}
              onChange={updatePOD}
              placeholder={getNextPODNumber()}
            />
          </div>
          <div className="field">
            <label>Status</label>
            <select name="status" value={podForm.status} onChange={updatePOD}>
              <option>IN TRANSIT</option>
              <option>OUT FOR DELIVERY</option>
              <option>DELIVERED</option>
              <option>SHORTAGE</option>
              <option>DAMAGE</option>
              <option>DELIVERED WITH CLAIM</option>
              <option>CANCELLED</option>
            </select>
          </div>
          <div className="field">
            <label>Received By *</label>
            <input
              name="receivedBy"
              value={podForm.receivedBy}
              onChange={updatePOD}
              placeholder="Receiver Name"
            />
          </div>
          <div className="field">
            <label>Receiver Mobile</label>
            <input
              name="receiverMobile"
              value={podForm.receiverMobile}
              onChange={updatePOD}
              placeholder="Mobile Number"
            />
          </div>
        </div>

        {/* =====================================================
            SHORTAGE / DAMAGE / CLAIM
        ===================================================== */}
        <div className="sectionTitle">💰 SHORTAGE / DAMAGE / CLAIM</div>

        <div className="formGrid">
          <div className="field">
            <label>Shortage Amount (₹)</label>
            <input
              type="number"
              name="shortageAmount"
              value={podForm.shortageAmount}
              onChange={updatePOD}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label>Damage Amount (₹)</label>
            <input
              type="number"
              name="damageAmount"
              value={podForm.damageAmount}
              onChange={updatePOD}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label>Claim Amount (₹)</label>
            <input
              type="number"
              name="claimAmount"
              value={podForm.claimAmount}
              onChange={updatePOD}
              placeholder="0"
            />
          </div>
        </div>

        {/* =====================================================
            POD SCAN / UPLOAD - FRONT & BACK
        ===================================================== */}
        <div className="sectionTitle" style={{ background: '#c62828', color: 'white', padding: '10px 15px', borderRadius: '6px' }}>
          📸 POD {isMobile ? 'SCAN' : 'UPLOAD'} — FRONT & BACK
        </div>

        <div className="formGrid">
          {/* FRONT SIDE */}
          <div className="field" style={{ border: '2px solid #1769aa', padding: '15px', borderRadius: '8px' }}>
            <label style={{ fontWeight: 'bold', color: '#1769aa' }}>📄 Front Side *</label>
            
            {isMobile ? (
              <>
                <button
                  type="button"
                  className="blueBtn"
                  onClick={() => {
                    setCameraSide('front');
                    setShowCamera(true);
                  }}
                  style={{ width: '100%', padding: '12px', marginBottom: '10px', fontSize: '16px' }}
                >
                  📸 SCAN FRONT SIDE
                </button>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      alert("Document size maximum 5 MB ho sakta hai.");
                      e.target.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setPodForm((prev) => ({
                        ...prev,
                        documentName: file.name,
                        documentType: file.type,
                        documentData: reader.result,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  style={{ padding: '8px', width: '100%' }}
                />
                <small style={{ color: '#666', fontSize: '11px' }}>
                  💡 SCAN button use karein ya file upload karein
                </small>
              </>
            ) : (
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    alert("Document size maximum 5 MB ho sakta hai.");
                    e.target.value = "";
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPodForm((prev) => ({
                      ...prev,
                      documentName: file.name,
                      documentType: file.type,
                      documentData: reader.result,
                    }));
                  };
                  reader.readAsDataURL(file);
                }}
                style={{ padding: '8px', width: '100%' }}
              />
            )}
            
            {podForm.documentName && (
              <div style={{ marginTop: "8px", padding: "8px", background: "#e3f2fd", borderRadius: "6px" }}>
                ✅ <strong>{podForm.documentName}</strong>
                <button
                  type="button"
                  className="deleteBtn"
                  style={{ marginLeft: "10px" }}
                  onClick={() =>
                    setPodForm((prev) => ({
                      ...prev,
                      documentName: "",
                      documentType: "",
                      documentData: "",
                    }))
                  }
                >
                  REMOVE
                </button>
              </div>
            )}
          </div>

          {/* BACK SIDE */}
          <div className="field" style={{ border: '2px solid #6b7280', padding: '15px', borderRadius: '8px' }}>
            <label style={{ fontWeight: 'bold', color: '#6b7280' }}>📄 Back Side (Optional)</label>
            
            {isMobile ? (
              <>
                <button
                  type="button"
                  className="blueBtn"
                  onClick={() => {
                    setCameraSide('back');
                    setShowCamera(true);
                  }}
                  style={{ width: '100%', padding: '12px', marginBottom: '10px', fontSize: '16px', background: '#6b7280' }}
                >
                  📸 SCAN BACK SIDE
                </button>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      alert("Document size maximum 5 MB ho sakta hai.");
                      e.target.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setPodForm((prev) => ({
                        ...prev,
                        documentNameBack: file.name,
                        documentTypeBack: file.type,
                        documentDataBack: reader.result,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  style={{ padding: '8px', width: '100%' }}
                />
                <small style={{ color: '#666', fontSize: '11px' }}>
                  💡 SCAN button use karein ya file upload karein
                </small>
              </>
            ) : (
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    alert("Document size maximum 5 MB ho sakta hai.");
                    e.target.value = "";
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPodForm((prev) => ({
                      ...prev,
                      documentNameBack: file.name,
                      documentTypeBack: file.type,
                      documentDataBack: reader.result,
                    }));
                  };
                  reader.readAsDataURL(file);
                }}
                style={{ padding: '8px', width: '100%' }}
              />
            )}
            
            {podForm.documentNameBack && (
              <div style={{ marginTop: "8px", padding: "8px", background: "#f3f4f6", borderRadius: "6px" }}>
                ✅ <strong>{podForm.documentNameBack}</strong>
                <button
                  type="button"
                  className="deleteBtn"
                  style={{ marginLeft: "10px" }}
                  onClick={() =>
                    setPodForm((prev) => ({
                      ...prev,
                      documentNameBack: "",
                      documentTypeBack: "",
                      documentDataBack: "",
                    }))
                  }
                >
                  REMOVE
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            REMARKS
        ===================================================== */}
        <div className="sectionTitle">📝 REMARKS</div>

        <div className="formGrid">
          <div className="field full">
            <label>Delivery / POD Remarks</label>
            <textarea
              name="remarks"
              value={podForm.remarks}
              onChange={updatePOD}
              placeholder="Shortage, damage, receiver remarks, special instructions..."
            />
          </div>
        </div>

        {/* =====================================================
            BUTTONS
        ===================================================== */}
        <div className="formButtons">
          {editingPOD && (
            <button
              className="grayBtn"
              onClick={() => {
                setEditingPOD(null);
                setPodForm(createEmptyPOD());
              }}
            >
              CANCEL
            </button>
          )}
          <button className="greenBtn" onClick={savePOD}>
            {editingPOD ? "UPDATE POD" : "SAVE POD"}
          </button>
        </div>
      </div>

      {/* =====================================================
          POD LIST
      ===================================================== */}
      <div className="card">
        <div className="listHeader">
          <div>
            <h2>POD / Delivery List</h2>
            <p>Total: {pods.length}</p>
          </div>
          <input
            className="search"
            placeholder="Search POD / Trip / Bilty / Vehicle / Party..."
            value={podSearch}
            onChange={(e) => setPodSearch(e.target.value)}
          />
        </div>

        <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>POD No.</th>
                <th>Bilty</th>
                <th>From</th>
                <th>To</th>
                <th>Vehicle</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Claim</th>
                <th>Scan</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPODs.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.podNo}</strong></td>
                  <td>{item.biltyNo}</td>
                  <td>{item.from}</td>
                  <td>{item.to}</td>
                  <td>{item.vehicleNo}</td>
                  <td>{formatDate(item.deliveryDate)}</td>
                  <td>
                    <span className={item.status === "DELIVERED" ? "statusActive" : "statusInactive"}>
                      {item.status}
                    </span>
                  </td>
                  <td>₹{money(item.claimAmount)}</td>
                  <td>
                    {item.documentData && <span style={{ color: '#16855b' }}>📄Front</span>}
                    {item.documentDataBack && <span style={{ color: '#1769aa', marginLeft: '5px' }}>📄Back</span>}
                    {!item.documentData && !item.documentDataBack && <span style={{ color: '#999' }}>❌</span>}
                  </td>
                  <td>
                    <button className="editBtn" onClick={() => editPOD(item)}>EDIT</button>
                    {item.documentData && (
                      <button 
                        className="printBtn" 
                        onClick={() => viewPODDocument(item, 'front')}
                        style={{ background: '#1769aa' }}
                      >
                        📄 Front
                      </button>
                    )}
                    {item.documentDataBack && (
                      <button 
                        className="printBtn" 
                        onClick={() => viewPODDocument(item, 'back')}
                        style={{ background: '#6b7280' }}
                      >
                        📄 Back
                      </button>
                    )}
                    <button className="deleteBtn" onClick={() => deletePOD(item.id)}>DELETE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPODs.length === 0 && <div className="empty">No POD found.</div>}
        </div>
      </div>
    </>
  );
};

  // =========================================================
  // ACCOUNTS FUNCTIONS
  // =========================================================

  const updateAccount = (e) => {
    const { name, value } = e.target;

    setAccountForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

    const saveAccount = async () => {
  console.log("🚀 SAVE ACCOUNT STARTED");
  console.log("📝 accountForm:", accountForm);
  
  if (!accountForm.date) { alert("Date select karein."); return; }
  if (!accountForm.partyName.trim()) { alert("Party Name enter karein."); return; }
  if (!accountForm.amount || Number(accountForm.amount) <= 0) { alert("Valid amount enter karein."); return; }

  const finalAccountData = {
    date: accountForm.date,
    type: accountForm.type || "RECEIPT",
    partyName: accountForm.partyName || "",
    amount: String(accountForm.amount || 0),
    paymentMode: accountForm.paymentMode || "BANK",
    referenceNo: accountForm.referenceNo || "",
    category: accountForm.category || "OTHER",
    remarks: accountForm.remarks || "",
    allocationType: accountForm.allocationType || "ON ACCOUNT",
    tdsType: accountForm.tdsType || "NO TDS",
    tdsName: accountForm.tdsName || "",
    tanNumber: accountForm.tanNumber || "",
    tdsAmount: String(accountForm.tdsAmount || 0),
    billNo: accountForm.billNo || "",
    billIds: accountForm.billIds || [],
    billAllocations: accountForm.billAllocations || {},
    billTds: accountForm.billTds || {},
    billDeductions: accountForm.billDeductions || {},
    billNetAmounts: accountForm.billNetAmounts || {},
  };

  console.log("💾 FINAL DATA SENDING:", finalAccountData);

  try {
    let result;
    if (editingAccount && editingAccount.id) {
      result = await supabase
        .from('accounts')
        .update(finalAccountData)
        .eq('id', editingAccount.id);
    } else {
      // Money Receipt No. generate karo
      if (finalAccountData.type === "RECEIPT") {
        finalAccountData.moneyReceiptNo = `MR-${new Date().getFullYear()}-${String(accounts.length + 1).padStart(4, "0")}`;
      }
      result = await supabase
        .from('accounts')
        .insert([finalAccountData]);
    }
    
    console.log("📊 RESULT:", result);
    
    if (result.error) throw result.error;
    
    alert("✅ Account Entry saved successfully.");
    setAccountForm(createEmptyAccount());
    setEditingAccount(null);
    await loadAllData();
  } catch (e) { 
    console.error("❌ ERROR:", e);
    alert("❌ Error: " + e.message); 
  }
};
    
  const editAccount = (item) => {
    setAccountForm({
      ...item,
      amount: item.amount || "",
    });

    setEditingAccount(item);
  };


    const deleteAccount = async (id) => {
    if (!window.confirm("Delete this account entry?")) return;
    try {
      let { error } = await supabase.from('accounts').delete().eq('id', id);
      if (!error) {
        loadAllData();
      }
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
  };

  // =========================================================
  // ACCOUNTS SUMMARY
  // =========================================================

  const totalReceipt = accounts
    .filter((item) => item.type === "RECEIPT")
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0
    );

  const totalPayment = accounts
    .filter((item) => item.type === "PAYMENT")
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0
    );

  const totalExpense = accounts
    .filter((item) => item.type === "EXPENSE")
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0
    );

  const accountBalance =
    totalReceipt -
    totalPayment -
    totalExpense;
  // =========================================================
  // ACCOUNTS PAGE
  // =========================================================

  const renderAccountsPage = () => {
    const filteredAccounts = accounts.filter((item) =>
      `
        ${item.date}
        ${item.type}
        ${item.partyName}
        ${item.amount}
        ${item.paymentMode}
        ${item.referenceNo}
        ${item.category}
        ${item.remarks}
      `
        .toLowerCase()
        .includes(accountSearch.toLowerCase())
    );

    return (
  <>
    <div className="pageTitle">
      <h2>Accounts</h2>
          <p>
            Receipt, Payment, Expense & Ledger Management
          </p>
        </div>


        {/* =====================================================
            ACCOUNT SUMMARY
        ===================================================== */}

        <div className="marginBox">

          <div>
            <span>TOTAL RECEIPT</span>

            <strong>
              ₹{money(totalReceipt)}
            </strong>
          </div>

          <div>
            <span>TOTAL PAYMENT</span>

            <strong>
              ₹{money(totalPayment)}
            </strong>
          </div>

          <div>
            <span>TOTAL EXPENSE</span>

            <strong>
              ₹{money(totalExpense)}
            </strong>
          </div>

          <div>
            <span>NET BALANCE</span>

            <strong>
              ₹{money(accountBalance)}
            </strong>
          </div>

        </div>


        {/* =====================================================
            ACCOUNT FORM
        ===================================================== */}

        <div className="card">

          <div className="tripHeader">

            <div>
              <h3>
                {editingAccount
                  ? "Edit Account Entry"
                  : "New Account Entry"}
              </h3>
            </div>

          </div>


          <div className="sectionTitle">
            TRANSACTION DETAILS
          </div>


          <div className="formGrid">

            <div className="field">
              <label>Date *</label>

              <input
                type="date"
                name="date"
                value={accountForm.date}
                onChange={updateAccount}
              />
            </div>

            {accountForm.type === "RECEIPT" && (
    <div className="field">
      <label>Money Receipt No.</label>

      <input
        type="text"
        value={
          editingAccount?.moneyReceiptNo ||
          "AUTO GENERATE"
        }
        readOnly
        style={{
          fontWeight: "700",
          letterSpacing: "0.5px",
        }}
      />
    </div>
  )}




            <div className="field">
              <label>Entry Type *</label>

              <select
                name="type"
                value={accountForm.type}
                onChange={updateAccount}
              >
                <option value="RECEIPT">
                  RECEIPT
                </option>

                <option value="PAYMENT">
                  PAYMENT
                </option>

                <option value="EXPENSE">
                  EXPENSE
                </option>
              </select>
            </div>


            <div className="field">
              <label>Party Name *</label>

              <input
                type="text"
                name="partyName"
                value={accountForm.partyName}
                onChange={updateAccount}
                placeholder="Customer / Transporter / Party"
              />
            </div>



  <div className="field">
    <label>Entry Allocation</label>

    <select
      name="allocationType"
      value={accountForm.allocationType || "ON ACCOUNT"}
      onChange={updateAccount}
    >
      <option value="ON ACCOUNT">
        ON ACCOUNT
      </option>

      <option value="BILL">
        AGAINST BILL
      </option>
    </select>
  </div>



  {accountForm.allocationType === "BILL" && (
    <div className="field full">

      <label>Pending Bills / Bilty</label>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <strong>
          Select Pending Bills
        </strong>

        <button
          type="button"
          className="blueBtn"
          onClick={() => {
            setAccountForm((prev) => ({
              ...prev,
              showBillSelector:
                !prev.showBillSelector,
            }));
          }}
        >
          {accountForm.showBillSelector
            ? "− CLOSE BILLS"
            : "+ ADD BILL"}
        </button>
      </div>


      {/* =====================================================
          ADD BILL SELECTOR
      ===================================================== */}

      {accountForm.showBillSelector && (

        <div
          className="card"
          style={{
            marginBottom: "15px",
            padding: "15px",
          }}
        >

          <h4>
            Customer Pending Bills
          </h4>

          <div className="tableWrapper">

            <table>

              <thead>
                <tr>
                  <th>Select</th>
                  <th>Bilty No.</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Bill Amount</th>
                  <th>Already Adjusted</th>
                  <th>Pending</th>
                  <th>Adjust Amount</th>
                  <th>TDS</th>
                  <th>Deduction</th>
                </tr>
              </thead>

              <tbody>

                {bilties
                  .filter((item) => {

                    if (!accountForm.partyName) {
                      return false;
                    }

                    const party =
                      String(
                        accountForm.partyName || ""
                      )
                        .trim()
                        .toUpperCase();

                    const consignor =
                      String(
                        item.consignor || ""
                      )
                        .trim()
                        .toUpperCase();

                    const consignee =
                      String(
                        item.consignee || ""
                      )
                        .trim()
                        .toUpperCase();

                    if (
                      party !== consignor &&
                      party !== consignee
                    ) {
                      return false;
                    }

                    /* Already adjusted amount */

                    const adjusted =
                      accounts.reduce(
                        (sum, account) => {

                          if (
                            account.id ===
                            editingAccount?.id
                          ) {
                            return sum;
                          }

                          const allocation =
                            account
                              .billAllocations?.[
                              item.id
                            ];

                          const tds =
                            account
                              .billTds?.[
                              item.id
                            ];

                          const deduction =
                            account
                              .billDeductions?.[
                              item.id
                            ];

                          return (
                            sum +
                            Number(
                              allocation || 0
                            ) +
                            Number(
                              tds || 0
                            ) +
                            Number(
                              deduction || 0
                            )
                          );
                        },
                        0
                      );

                    const billAmount =
                      Number(
                        item.freight || 0
                      );

                    const pending =
                      billAmount - adjusted;

                    return pending > 0;
                  })
                  .map((item) => {

                    const billAmount =
                      Number(
                        item.freight || 0
                      );

                    const alreadyAdjusted =
                      accounts.reduce(
                        (sum, account) => {

                          if (
                            account.id ===
                            editingAccount?.id
                          ) {
                            return sum;
                          }

                          return (
                            sum +
                            Number(
                              account
                                .billAllocations?.[
                                item.id
                              ] || 0
                            ) +
                            Number(
                              account
                                .billTds?.[
                                item.id
                              ] || 0
                            ) +
                            Number(
                              account
                                .billDeductions?.[
                                item.id
                              ] || 0
                            )
                          );
                        },
                        0
                      );

                    const pending =
                      Math.max(
                        0,
                        billAmount -
                          alreadyAdjusted
                      );

                    const selected =
                      (
                        accountForm.billIds ||
                        []
                      ).includes(
                        String(item.id)
                      );

                    return (
                      <tr key={item.id}>

                        <td>

                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {

                              const checked =
                                e.target.checked;

                              setAccountForm(
                                (prev) => {

                                  const oldIds =
                                    prev.billIds ||
                                    [];

                                  const oldAllocations =
                                    prev.billAllocations ||
                                    {};

                                  const oldTds =
                                    prev.billTds ||
                                    {};

                                  const oldDeductions =
                                    prev.billDeductions ||
                                    {};

                                  if (checked) {

                                    return {
                                      ...prev,

                                      billIds: [
                                        ...oldIds,
                                        String(
                                          item.id
                                        ),
                                      ],

                                      billAllocations:
                                        {
                                          ...oldAllocations,

                                          [item.id]:
                                            oldAllocations[
                                              item.id
                                            ] || "",
                                        },

                                      billTds: {
                                        ...oldTds,

                                        [item.id]:
                                          oldTds[
                                            item.id
                                          ] || "",
                                      },

                                      billDeductions:
                                        {
                                          ...oldDeductions,

                                          [item.id]:
                                            oldDeductions[
                                              item.id
                                            ] || "",
                                        },
                                    };

                                  }

                                  const newIds =
                                    oldIds.filter(
                                      (id) =>
                                        id !==
                                        String(
                                          item.id
                                        )
                                    );

                                  const newAllocations =
                                    {
                                      ...oldAllocations,
                                    };

                                  const newTds = {
                                    ...oldTds,
                                  };

                                  const newDeductions =
                                    {
                                      ...oldDeductions,
                                    };

                                  delete newAllocations[
                                    item.id
                                  ];

                                  delete newTds[
                                    item.id
                                  ];

                                  delete newDeductions[
                                    item.id
                                  ];

                                  return {
                                    ...prev,

                                    billIds:
                                      newIds,

                                    billAllocations:
                                      newAllocations,

                                    billTds:
                                      newTds,

                                    billDeductions:
                                      newDeductions,
                                  };
                                }
                              );
                            }}
                          />

                        </td>

                        <td>
                          <strong>
                            {item.bilty}
                          </strong>
                        </td>

                        <td>
                          {formatDate(item.date)}
                        </td>

                        <td>
                          {item.consignor ||
                            item.consignee ||
                            "-"}
                        </td>

                        <td>
                          ₹
                          {money(
                            billAmount
                          )}
                        </td>

                        <td>
                          ₹
                          {money(
                            alreadyAdjusted
                          )}
                        </td>

                        <td>
                          <strong>
                            ₹
                            {money(
                              pending
                            )}
                          </strong>
                        </td>

                      </tr>
                    );

                  })}

              </tbody>

            </table>

          </div>

          {!accountForm.partyName && (
            <small>
              Pehle Party Name select/enter karein.
            </small>
          )}

        </div>
      )}


      {/* =====================================================
          SELECTED BILL SETTLEMENT
      ===================================================== */}

      {(accountForm.billIds || []).length > 0 && (

        <div className="tableWrapper">

          <table>

            <thead>

              <tr>
                <th>Bilty No.</th>
                <th>Bill Amount</th>
                <th>Adjust Amount</th>
                <th>TDS</th>
                <th>Deduction</th>
                <th>Net Received</th>
                <th>Pending</th>
                <th>Remove</th>
              </tr>

            </thead>

            <tbody>

              {(accountForm.billIds || []).map(
                (billId) => {

                  const bill =
                    bilties.find(
                      (item) =>
                        String(item.id) ===
                        String(billId)
                    );

                  if (!bill) {
                    return null;
                  }

                  const billAmount =
                    Number(
                      bill.freight || 0
                    );

                  const adjust =
                    Number(
                      accountForm
                        .billAllocations?.[
                        billId
                      ] || 0
                    );

                  const tds =
                    Number(
                      accountForm.billTds?.[
                        billId
                      ] || 0
                    );

                  const deduction =
                    Number(
                      accountForm
                        .billDeductions?.[
                        billId
                      ] || 0
                    );

                  const netReceived =
                    adjust;

                  const settlement =
                    adjust +
                    tds +
                    deduction;

                  const pending =
                    Math.max(
                      0,
                      billAmount -
                        settlement
                    );

                  return (
                    <tr key={billId}>

                      <td>
                        <strong>
                          {bill.bilty}
                        </strong>
                      </td>

                      <td>
                        ₹
                        {money(
                          billAmount
                        )}
                      </td>

                      <td>

                        <input
                          type="number"
                          min="0"
                          value={
                            accountForm
                              .billAllocations?.[
                              billId
                            ] || ""
                          }
                          onChange={(e) => {

                            const value =
                              e.target.value;

                            setAccountForm(
                              (prev) => ({
                                ...prev,

                                billAllocations:
                                  {
                                    ...(
                                      prev.billAllocations ||
                                      {}
                                    ),

                                    [billId]:
                                      value,
                                  },
                              })
                            );

                          }}
                          placeholder="Adjust"
                        />

                      </td>

                      <td>

                        <input
                          type="number"
                          min="0"
                          value={
                            accountForm
                              .billTds?.[
                              billId
                            ] || ""
                          }
                          onChange={(e) => {

                            const value =
                              e.target.value;

                            setAccountForm(
                              (prev) => ({
                                ...prev,

                                billTds: {
                                  ...(
                                    prev.billTds ||
                                    {}
                                  ),

                                  [billId]:
                                    value,
                                },
                              })
                            );

                          }}
                          placeholder="TDS"
                        />

                      </td>

                      <td>

                        <input
                          type="number"
                          min="0"
                          value={
                            accountForm
                              .billDeductions?.[
                              billId
                            ] || ""
                          }
                          onChange={(e) => {

                            const value =
                              e.target.value;

                            setAccountForm(
                              (prev) => ({
                                ...prev,

                                billDeductions:
                                  {
                                    ...(
                                      prev.billDeductions ||
                                      {}
                                    ),

                                    [billId]:
                                      value,
                                  },
                              })
                            );

                          }}
                          placeholder="Deduction"
                        />

                      </td>

                      <td>
                        <strong>
                          ₹
                          {money(
                            netReceived
                          )}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          ₹
                          {money(
                            pending
                          )}
                        </strong>
                      </td>

                      <td>

                        <button
                          type="button"
                          className="deleteBtn"
                          onClick={() => {

                            setAccountForm(
                              (prev) => {

                                const newIds =
                                  (
                                    prev.billIds ||
                                    []
                                  ).filter(
                                    (id) =>
                                      String(id) !==
                                      String(
                                        billId
                                      )
                                  );

                                const allocations =
                                  {
                                    ...(
                                      prev.billAllocations ||
                                      {}
                                    ),
                                  };

                                const tds = {
                                  ...(
                                    prev.billTds ||
                                    {}
                                  ),
                                };

                                const deductions =
                                  {
                                    ...(
                                      prev.billDeductions ||
                                      {}
                                    ),
                                  };

                                delete allocations[
                                  billId
                                ];

                                delete tds[
                                  billId
                                ];

                                delete deductions[
                                  billId
                                ];

                                return {
                                  ...prev,

                                  billIds:
                                    newIds,

                                  billAllocations:
                                    allocations,

                                  billTds:
                                    tds,

                                  billDeductions:
                                    deductions,
                                };

                              }
                            );

                          }}
                        >
                          REMOVE
                        </button>

                      </td>

                    </tr>
                  );

                }
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  )}

  <div className="field">
    <label>TDS Type</label>

    <select
      name="tdsType"
      value={accountForm.tdsType || "NO TDS"}
      onChange={updateAccount}
    >
      <option value="NO TDS">
        NO TDS
      </option>

      <option value="TDS">
        TDS
      </option>
    </select>
  </div>

  <div className="field">
    <label>TDS Name</label>

    <select
      name="tdsName"
      value={accountForm.tdsName || ""}
      onChange={updateAccount}
    >
      <option value="">
        Select TDS Name
      </option>

      {[...new Set(
        customers
          .map((item) => item.name)
          .filter(Boolean)
      )].map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  </div>

  <div className="field">
    <label>TAN Number</label>

    <input
      type="text"
      name="tanNumber"
      value={accountForm.tanNumber || ""}
      onChange={updateAccount}
      placeholder="TAN Number"
    />
  </div>

  <div className="field">
    <label>TDS Amount</label>

    <input
      type="number"
      name="tdsAmount"
      value={accountForm.tdsAmount || ""}
      onChange={updateAccount}
      placeholder="TDS Amount"
    />
  </div>


            <div className="field">
              <label>Amount *</label>

              <input
                type="number"
                name="amount"
                value={accountForm.amount}
                onChange={updateAccount}
                placeholder="50000"
              />
            </div>


            <div className="field">
              <label>Payment Mode</label>

              <select
                name="paymentMode"
                value={accountForm.paymentMode}
                onChange={updateAccount}
              >
                <option value="BANK">
                  BANK
                </option>

                <option value="CASH">
                  CASH
                </option>

                <option value="UPI">
                  UPI
                </option>

                <option value="CHEQUE">
                  CHEQUE
                </option>
              </select>
            </div>


            <div className="field">
              <label>Reference / Cheque No.</label>

              <input
                type="text"
                name="referenceNo"
                value={accountForm.referenceNo}
                onChange={updateAccount}
                placeholder="UTR / Cheque Number"
              />
            </div>


            <div className="field">
              <label>Expense Category</label>

              <select
                name="category"
                value={accountForm.category}
                onChange={updateAccount}
              >
                <option value="OTHER">
                  OTHER
                </option>

                <option value="DIESEL">
                  DIESEL
                </option>

                <option value="TOLL">
                  TOLL
                </option>

                <option value="REPAIR">
                  REPAIR
                </option>

                <option value="LOADING">
                  LOADING / UNLOADING
                </option>

                <option value="DRIVER">
                  DRIVER EXPENSE
                </option>

                <option value="OFFICE">
                  OFFICE EXPENSE
                </option>
              </select>
            </div>


            <div className="field full">
              <label>Remarks</label>

              <textarea
                name="remarks"
                value={accountForm.remarks}
                onChange={updateAccount}
                placeholder="Payment / receipt / expense details..."
              />
            </div>

          </div>


          <div className="formButtons">

            {editingAccount && (
              <button
                className="grayBtn"
                onClick={() => {
                  setEditingAccount(null);
                  setAccountForm(
                    createEmptyAccount()
                  );
                }}
              >
                CANCEL
              </button>
            )}


            <button
              className="greenBtn"
              onClick={saveAccount}
            >
              {editingAccount
                ? "UPDATE ENTRY"
                : "SAVE ENTRY"}
            </button>

          </div>

        </div>

  {/* =====================================================
      PARTY WISE LEDGER
  ===================================================== */}

  <div className="card">

    <div className="listHeader">

      <div>
        <h2>Party Wise Ledger</h2>
        <p>Receipt / Payment / Expense ka party-wise balance</p>
      </div>

      <select
        className="search"
        value={ledgerParty}
        onChange={(e) => setLedgerParty(e.target.value)}
      >
        <option value="">Select Party</option>

        {[...new Set(
          accounts
            .map((item) => item.partyName)
            .filter(Boolean)
        )].map((party) => (
          <option key={party} value={party}>
            {party}
          </option>
        ))}
      </select>

    </div>

  {/* =====================================================
      CUSTOMER WISE LEDGER REPORT
  ===================================================== */}

<div className="card">

    <div className="listHeader">

      <div>
        <h2>Customer Wise Ledger Report</h2>

        <p>
          Customer ka Bill, Receipt, TDS, Deduction aur Pending
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select
          className="search"
          value={customerLedgerParty}
          onChange={(e) =>
            setCustomerLedgerParty(e.target.value)
          }
          style={{ minWidth: '200px' }}
        >
          <option value="">
            Select Customer
          </option>

          {[...new Set(
            customers
              .map((item) => item.name)
              .filter(Boolean)
          )].map((name) => (
            <option
              key={name}
              value={name}
            >
              {name}
            </option>
          ))}

        </select>

        {/* 🔥 PRINT BUTTON */}
        {customerLedgerParty && (
          <button
            className="greenBtn"
            onClick={() => {
              // Get current customer data
              const selectedCustomer = customers.find(
                (item) =>
                  String(item.name || "")
                    .trim()
                    .toUpperCase() ===
                  String(customerLedgerParty || "")
                    .trim()
                    .toUpperCase()
              );

              const customerName = selectedCustomer?.name || customerLedgerParty;
              const customerAddress = selectedCustomer?.address || "";
              const customerGST = selectedCustomer?.gst || selectedCustomer?.gstin || "";

              // Calculate totals from billRows
              const totalBills = billRows.reduce((sum, item) => sum + item.billAmount, 0);
              const totalReceived = billRows.reduce((sum, item) => sum + item.received, 0);
              const totalTDS = billRows.reduce((sum, item) => sum + item.tds, 0);
              const totalDeduction = billRows.reduce((sum, item) => sum + item.deduction, 0);
              const totalPending = billRows.reduce((sum, item) => sum + item.pending, 0);

              const printWindow = window.open('', '_blank', 'width=1000,height=700');
              if (!printWindow) {
                alert("Popup blocked! Please allow popups.");
                return;
              }

              // Build table rows
              let tableRows = '';
              billRows.forEach((item) => {
                tableRows += `
                  <tr>
                    <td>${formatDate(item.billDate)}</td>
                    <td>${item.billNumber || "-"}</td>
                    <td>${item.biltyNo || "-"}</td>
                    <td class="right">₹${money(item.billAmount)}</td>
                    <td class="right">₹${money(item.received)}</td>
                    <td class="right">₹${money(item.tds)}</td>
                    <td class="right">₹${money(item.deduction)}</td>
                    <td class="right">₹${money(item.pending)}</td>
                  </tr>
                `;
              });

              printWindow.document.write(`
                <html>
                  <head>
                    <title>Customer Ledger - ${customerName}</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 30px; }
                      .company { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                      .subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
                      .customer-name { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0 10px; }
                      .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
                      .summary-item { border: 1px solid #000; padding: 12px; text-align: center; border-radius: 4px; }
                      .summary-item span { font-size: 12px; color: #666; }
                      .summary-item strong { display: block; font-size: 20px; margin-top: 5px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #000; padding: 8px 10px; text-align: left; font-size: 13px; }
                      th { background: #f0f0f0; font-weight: bold; }
                      .right { text-align: right; }
                      .address { margin: 10px 0; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; }
                      .address strong { font-weight: bold; }
                      tfoot tr { background: #f0f0f0; font-weight: bold; }
                      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; }
                      .gst { margin: 5px 0; }
                      @media print {
                        .no-print { display: none; }
                        body { margin: 20px; }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="company">${COMPANY.name}</div>
                    <div class="subtitle">Customer Wise Ledger Report</div>
                    
                    <div class="customer-name">${customerName}</div>
                    
                    <div class="address">
                      <strong>Address:</strong> ${customerAddress || "-"}<br/>
                      <strong>GSTIN:</strong> ${customerGST || "-"}
                    </div>
                    
                    <div class="summary">
                      <div class="summary-item">
                        <span>Total Bill</span>
                        <strong>₹${money(totalBills)}</strong>
                      </div>
                      <div class="summary-item">
                        <span>Total Received</span>
                        <strong>₹${money(totalReceived)}</strong>
                      </div>
                      <div class="summary-item">
                        <span>Total TDS</span>
                        <strong>₹${money(totalTDS)}</strong>
                      </div>
                      <div class="summary-item" style="border-color: #c62828;">
                        <span>Total Pending</span>
                        <strong style="color: #c62828;">₹${money(totalPending)}</strong>
                      </div>
                    </div>
                    
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Bill No.</th>
                          <th>Bilty No.</th>
                          <th class="right">Bill Amount</th>
                          <th class="right">Received</th>
                          <th class="right">TDS</th>
                          <th class="right">Deduction</th>
                          <th class="right">Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${tableRows || `<tr><td colspan="8" style="text-align:center;">No bills found for this customer.</td></tr>`}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="3">TOTAL (${billRows.length} Bills)</td>
                          <td class="right">₹${money(totalBills)}</td>
                          <td class="right">₹${money(totalReceived)}</td>
                          <td class="right">₹${money(totalTDS)}</td>
                          <td class="right">₹${money(totalDeduction)}</td>
                          <td class="right">₹${money(totalPending)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    <div class="footer">
                      This is a computer generated report.
                    </div>
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.focus();
              printWindow.print();
            }}
            style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
          >
            🖨️ PRINT LEDGER
          </button>
        )}
      </div>

    </div>
    
    {customerLedgerParty && (() => {

      /* =================================================
        CUSTOMER DETAILS
      ================================================= */

      const selectedCustomer = customers.find(
        (item) =>
          String(item.name || "")
            .trim()
            .toUpperCase() ===
          String(customerLedgerParty || "")
            .trim()
            .toUpperCase()
      );

      const customerName =
        selectedCustomer?.name ||
        customerLedgerParty;

      const customerAddress =
        selectedCustomer?.address ||
        "";

      const customerGST =
        selectedCustomer?.gst ||
        selectedCustomer?.gstin ||
        "";


/* =================================================
        CUSTOMER BILLS (SIRF GENERATED BILLS)
      ================================================= */

      // 🔥 SIRF GENERATED BILLS (MANUAL + AUTO GENERATED) — Bilty se nahi
      const manualBills = bills.filter(
        (bill) => {
          const party =
            String(customerName || "")
              .trim()
              .toUpperCase();

          const billParty =
            String(bill.partyName || "")
              .trim()
              .toUpperCase();

          return billParty === party;
        }
      );

      // 🔥 SIRF MANUAL BILLS (KOI BILTY SE NAHI)
      const customerBills = manualBills;

      console.log("🔍 customerBills:", customerBills);
      console.log("🔍 customerBills length:", customerBills.length);


      /* =================================================
        BILL WISE CALCULATION
      ================================================= */

      const billRows = customerBills.map(
  (bill) => {
    try {
      const billId = String(bill.id || "");
      
      // 🔥 SAFE ACCESS — Agar field exist nahi karti toh default value
      const billAmount = Number(bill?.subtotal || bill?.freight || 0);
      const billNumber = bill?.bilty || bill?.billNo || "-";
      const biltyNo = bill?.biltyNo || bill?.bilty || "-";
      const billDate = bill?.date || new Date().toISOString().slice(0, 10);

      const received = accounts.reduce(
        (sum, account) => {
          return sum + Number(account?.billAllocations?.[billId] || 0);
        },
        0
      );

      const tds = accounts.reduce(
        (sum, account) => {
          return sum + Number(account?.billTds?.[billId] || 0);
        },
        0
      );

      const deduction = accounts.reduce(
        (sum, account) => {
          return sum + Number(account?.billDeductions?.[billId] || 0);
        },
        0
      );

      const pending = Math.max(0, billAmount - received - tds - deduction);

      return {
        bill: bill,
        billNumber: billNumber,
        biltyNo: biltyNo,
        billDate: billDate,
        billAmount: billAmount,
        received: received,
        tds: tds,
        deduction: deduction,
        pending: pending
      };
    } catch (e) {
      console.error("Error processing bill:", bill, e);
      return null; // 🔥 Error wali bill ko skip karo
    }
  }
).filter(item => item !== null); // 🔥 Null items ko filter out karo
      /* =================================================
        CUSTOMER TOTALS
      ================================================= */

      const totalBills =
        billRows.reduce(
          (sum, item) =>
            sum + item.billAmount,
          0
        );


      const totalReceived =
        billRows.reduce(
          (sum, item) =>
            sum + item.received,
          0
        );


      const totalTDS =
        billRows.reduce(
          (sum, item) =>
            sum + item.tds,
          0
        );


      const totalDeduction =
        billRows.reduce(
          (sum, item) =>
            sum + item.deduction,
          0
        );


      const totalPending =
        billRows.reduce(
          (sum, item) =>
            sum + item.pending,
          0
        );


      /* =================================================
        CUSTOMER MONEY RECEIPTS
      ================================================= */

      const customerReceipts =
        accounts
          .filter(
            (item) =>
              item.type === "RECEIPT" &&
              String(item.partyName || "")
                .trim()
                .toUpperCase() ===
              String(customerName || "")
                .trim()
                .toUpperCase()
          )
          .sort(
            (a, b) =>
              new Date(a.date) -
              new Date(b.date)
          );


      return (
        <>

          {/* =================================================
            CUSTOMER SUMMARY
          ================================================= */}

          <div className="marginBox">

            <div>
              <span>CUSTOMER NAME</span>

              <strong>
                {customerName}
              </strong>
            </div>


            <div>
              <span>GSTIN</span>

              <strong>
                {customerGST || "-"}
              </strong>
            </div>


            <div>
              <span>TOTAL BILL</span>

              <strong>
                ₹{money(totalBills)}
              </strong>
            </div>


            <div>
              <span>TOTAL RECEIVED</span>

              <strong>
                ₹{money(totalReceived)}
              </strong>
            </div>


            <div>
              <span>TOTAL TDS</span>

              <strong>
                ₹{money(totalTDS)}
              </strong>
            </div>


            <div>
              <span>TOTAL DEDUCTION</span>

              <strong>
                ₹{money(totalDeduction)}
              </strong>
            </div>


            <div>
              <span>TOTAL PENDING</span>

              <strong>
                ₹{money(totalPending)}
              </strong>
            </div>

          </div>


          {/* =================================================
            CUSTOMER ADDRESS
          ================================================= */}

          <div
            className="remarks"
            style={{
              marginTop: "15px"
            }}
          >

            <strong>
              CUSTOMER ADDRESS
            </strong>

            <p>
              {customerAddress || "-"}
            </p>

          </div>


          {/* =================================================
            BILL / BILTY WISE DETAILS
          ================================================= */}

          <div className="sectionTitle">

            BILL / BILTY WISE OUTSTANDING

          </div>


          <div className="tableWrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                 <th>Bill No.</th>

        <th>Bilty No.</th>    {/* 🔥 NAYA COLUMN */}


                  <th>
                    Bill Amount
                  </th>

                  <th>
                    Received
                  </th>

                  <th>
                    TDS
                  </th>

                  <th>
                    Deduction
                  </th>

                  <th>
                    Pending
                  </th>

                </tr>

              </thead>


              <tbody>

                {billRows.map(
                  (item) => (

                    <tr
                      key={item.bill.id}
                    >

                      <td>
  {formatDate(item.billDate)}
</td>


                      <td>
  <strong>
    {item.billNumber || "-"}
  </strong>
</td>


                      <td>
                        ₹
                        {money(
                          item.billAmount
                        )}
                      </td>


                      <td>
                        ₹
                        {money(
                          item.received
                        )}
                      </td>


                      <td>
                        ₹
                        {money(
                          item.tds
                        )}
                      </td>


                      <td>
                        ₹
                        {money(
                          item.deduction
                        )}
                      </td>


                      <td>

                        <strong>
                          ₹
                          {money(
                            item.pending
                          )}
                        </strong>

                      </td>

                    </tr>

                  )
                )}


                {billRows.length === 0 && (

                  <tr>

                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center"
                      }}
                    >
                      Is customer ki koi
                      bilty nahi mili.
                    </td>

                  </tr>

                )}

              </tbody>


              {billRows.length > 0 && (

                <tfoot>

                  <tr>

                    <th>
                      TOTAL
                    </th>

                    <th>
                      {billRows.length} Bills
                    </th>

                    <th>
                      ₹{money(totalBills)}
                    </th>

                    <th>
                      ₹{money(totalReceived)}
                    </th>

                    <th>
                      ₹{money(totalTDS)}
                    </th>

                    <th>
                      ₹{money(totalDeduction)}
                    </th>

                    <th>
                      ₹{money(totalPending)}
                    </th>

                  </tr>

                </tfoot>

              )}

            </table>

          </div>


          {/* =================================================
            MONEY RECEIPT WISE DETAILS
          ================================================= */}

          <div className="sectionTitle">

            CUSTOMER MONEY RECEIPT LEDGER

          </div>


          <div className="tableWrapper">

            <table>

              <thead>

                <tr>

                <th>
                  Date
                </th>

                <th>
                  Money Receipt No.
                </th>

                <th>
                  Payment Mode
                </th>

                <th>
                  Reference / Cheque No.
                </th>

                <th>
                  Amount
                </th>

              </tr>

            </thead>


            <tbody>

              {customerReceipts.map(
                (item) => (

                  <tr
                    key={item.id}
                  >

                    <td>
                      {formatDate(
                        item.date
                      )}
                    </td>


                    <td>

                      <strong>
                        {item.moneyReceiptNo ||
                          "-"}
                      </strong>

                    </td>


                    <td>
                      {item.paymentMode ||
                        "-"}
                    </td>


                    <td>
                      {item.referenceNo ||
                        "-"}
                    </td>


                    <td>

                      <strong>
                        ₹
                        {money(
                          item.amount
                        )}
                      </strong>

                    </td>

                  </tr>

                )
              )}


              {customerReceipts.length ===
                0 && (

                <tr>

                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center"
                    }}
                  >
                    Is customer ki koi
                    money receipt nahi hai.
                  </td>

                </tr>

              )}

            </tbody>


            {customerReceipts.length > 0 && (

              <tfoot>

                <tr>

                  <th
                    colSpan="4"
                  >
                    TOTAL RECEIPT
                  </th>

                  <th>

                    ₹
                    {money(
                      customerReceipts.reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.amount || 0
                          ),
                        0
                      )
                    )}

                  </th>

                </tr>

              </tfoot>

            )}

          </table>

        </div>

      </>

    );

  })()}

</div> /</div>


  {ledgerParty && (() => {

    const partyEntries = accounts
      .filter(
        (item) =>
          String(item.partyName || "")
            .trim()
            .toUpperCase() ===
          ledgerParty.trim().toUpperCase()
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


    let balance = 0;

    return (
      <>

        {/* PARTY SUMMARY */}

        <div className="marginBox">

          <div>
            <span>PARTY</span>

            <strong>
              {ledgerParty}
            </strong>
          </div>


          <div>
            <span>TOTAL RECEIPT</span>

            <strong>
              ₹
              {money(
                partyEntries
                  .filter(
                    (item) =>
                      item.type === "RECEIPT"
                  )
                  .reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.amount || 0
                      ),
                    0
                  )
              )}
            </strong>
          </div>


          <div>
            <span>TOTAL PAYMENT</span>

            <strong>
              ₹
              {money(
                partyEntries
                  .filter(
                    (item) =>
                      item.type === "PAYMENT"
                  )
                  .reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.amount || 0
                      ),
                    0
                  )
              )}
            </strong>
          </div>


          <div>
            <span>NET BALANCE</span>

            <strong>
              ₹
              {money(
                partyEntries.reduce(
                  (sum, item) => {

                    const amount =
                      Number(
                        item.amount || 0
                      );

                    if (
                      item.type ===
                      "RECEIPT"
                    ) {
                      return sum + amount;
                    }

                    return sum - amount;
                  },
                  0
                )
              )}
            </strong>
          </div>

        </div>


        {/* LEDGER TABLE */}

        <div className="tableWrapper">

          <table>

            <thead>

              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Particular</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>

            </thead>


            <tbody>

              {partyEntries.map((item) => {

                const amount =
                  Number(
                    item.amount || 0
                  );

                if (
                  item.type ===
                  "RECEIPT"
                ) {
                  balance += amount;
                } else {
                  balance -= amount;
                }

                return (
                  <tr key={item.id}>

                    <td>
                      {formatDate(
                        item.date
                      )}
                    </td>


                    <td>
                      <span
                        className={
                          item.type ===
                          "RECEIPT"
                            ? "statusActive"
                            : "statusInactive"
                        }
                      >
                        {item.type}
                      </span>
                    </td>


                    <td>

                      <strong>
                        {item.category ||
                          item.remarks ||
                          "-"}
                      </strong>

                    </td>


                    <td>
                      {item.type !==
                        "RECEIPT"
                        ? `₹${money(amount)}`
                        : "-"}
                    </td>


                    <td>
                      {item.type ===
                        "RECEIPT"
                        ? `₹${money(amount)}`
                        : "-"}
                    </td>


                    <td>

                      <strong>
                        ₹
                        {money(balance)}
                      </strong>

                    </td>

                  </tr>
                );

              })}

            </tbody>

          </table>


          {partyEntries.length === 0 && (
            <div className="empty">
              Is party ki koi account entry nahi hai.
            </div>
          )}

        </div>

      </>
    );

  })()}
  

        {/* =====================================================
            ACCOUNT LIST
        ===================================================== */}

        <div className="card">

          <div className="listHeader">

            <div>
              <h2>
                Accounts / Ledger
              </h2>

              <p>
                Total Entries: {accounts.length}
              </p>
            </div>

            <input
              className="search"
              placeholder="Search Party / Type / Reference..."
              value={accountSearch}
              onChange={(e) =>
                setAccountSearch(e.target.value)
              }
            />

          </div>

          <div className="tableWrapper">

            <table>

              <thead>

                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Party</th>
                  <th>Category</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th>Money Receipt</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {filteredAccounts.map(
                  (item) => (
                    <tr key={item.id}>

                      <td>
                        {formatDate(item.date)}
                      </td>

                      <td>
                        <span
                          className={
                            item.type === "RECEIPT"
                              ? "statusActive"
                              : "statusInactive"
                          }
                        >
                          {item.type}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {item.partyName}
                        </strong>
                      </td>

                      <td>
                        {item.category}
                      </td>

                      <td>
                        {item.paymentMode}
                      </td>

                      <td>
                        {item.referenceNo || "-"}
                      </td>

                      <td>
                        {item.type === "RECEIPT"
                          ? (
                              <strong>
                                {item.moneyReceiptNo || "-"}
                              </strong>
                            )
                          : "-"}
                      </td>

                      <td>
                        ₹{money(item.amount)}
                      </td>

                      <td>

                        <button
                          className="editBtn"
                          onClick={() =>
                            editAccount(item)
                          }
                        >
                          EDIT
                        </button>

                        {item.type === "RECEIPT" && (
                          <button
                            className="greenBtn"
                            onClick={() =>
                              setPrintMoneyReceipt(item)
                            }
                          >
                            PRINT RECEIPT
                          </button>
                        )}

                        <button
                          className="deleteBtn"
                          onClick={() =>
                            deleteAccount(item.id)
                          }
                        >
                          DELETE
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

            {filteredAccounts.length === 0 && (
              <div className="empty">
                No Account Entry found.
              </div>
            )}

          </div>

        </div>
      </>
    );
  };
  // =========================================================
  // BILL PAGE
  // =========================================================

  const renderBillPage = () => {
            const filteredBills = bills.filter(bill => {
      const searchTerm = billSearch.toLowerCase().trim();
      if (!searchTerm) return true;
      
      // Bill No search
      if (bill.billNo?.toLowerCase().includes(searchTerm)) return true;
      
      // Party Name search
      if (bill.partyName?.toLowerCase().includes(searchTerm)) return true;
      
      // Bilty No search (new)
      if (bill.biltyNo?.toLowerCase().includes(searchTerm)) return true;
      
      // Voucher No search (new)
      if (bill.vchNo?.toLowerCase().includes(searchTerm)) return true;
      
      // Item Description search
      const itemMatch = bill.items.some(item => 
        item.description?.toLowerCase().includes(searchTerm)
      );
      if (itemMatch) return true;
      
      return false;
    });

    return (
      <>
        <div className="pageTitle">
          <h2>{editingBill ? "Edit Bill" : "New Bill"}</h2>
          <p>Professional Bill / Invoice - Tally Prime Style</p>
        </div>

        <div className="card">
          <div className="biltyTop">
                        <div className="field">
                                      <div className="field">
              <label>IRN</label>
              <input
                name="irn"
                value={billForm.irn || ""}
                onChange={updateBill}
                placeholder="e-Invoice IRN"
              />
            </div>
            <div className="field">
              <label>Ack No.</label>
              <input
                name="ackNo"
                value={billForm.ackNo || ""}
                onChange={updateBill}
                placeholder="Acknowledgement No."
              />
            </div>
            <div className="field">
              <label>Ack Date</label>
              <input
                type="date"
                name="ackDate"
                value={billForm.ackDate || ""}
                onChange={updateBill}
              />
            </div>
            <div className="field">
              <label>Delivery Note</label>
              <input
                name="deliveryNote"
                value={billForm.deliveryNote || ""}
                onChange={updateBill}
                placeholder="Delivery Note"
              />
            </div>
            <div className="field">
              <label>Payment Terms</label>
              <input
                name="paymentTerms"
                value={billForm.paymentTerms || ""}
                onChange={updateBill}
                placeholder="Mode/Terms of Payment"
              />
            </div>
              <label>Bill / Invoice No.</label>
              <div className="inputButton">
                <input
                  name="billNo"
                  value={billForm.billNo}
                  onChange={updateBill}
                  placeholder="Manual or Auto (Leave blank for auto)"
                />
                <button
                  type="button"
                  className="blueBtn"
                  onClick={() => {
                    const autoNo = getNextBillNumber();
                    setBillForm(prev => ({ ...prev, billNo: autoNo }));
                  }}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  AUTO
                </button>
              </div>
              <small style={{ color: '#666', fontSize: '11px' }}>
                💡 Manual enter karein ya AUTO click karein
              </small>
            </div>
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={billForm.date}
                onChange={updateBill}
              />
            </div>
          </div>

          <div className="sectionTitle">PARTY / CUSTOMER DETAILS</div>
          
          <div className="formGrid">
            <div className="field">
              <label>Party Name *</label>
              <select
                value={billForm.partyName}
                onChange={(e) => selectBillParty(e.target.value)}
              >
                <option value="">Select Party</option>
                {customers.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>GSTIN</label>
              <input value={billForm.partyGST} readOnly />
            </div>
            <div className="field full">
              <label>Address</label>
              <input value={billForm.partyAddress} readOnly />
            </div>
          </div>

                    <div className="sectionTitle">BILL TYPE</div>
          
          <div className="formGrid">
            <div className="field">
              <label>Bill Type</label>
              <select
                name="billType"
                value={billForm.billType || "SALES"}
                onChange={updateBill}
              >
                <option value="TAX INVOICE">🧾 TAX INVOICE</option>
                <option value="CREDIT NOTE">📝 CREDIT NOTE</option>
                <option value="DEBIT NOTE">📝 DEBIT NOTE</option>
                <option value="JOURNAL">📒 JOURNAL</option>
                <option value="RECEIPT">💵 RECEIPT</option>
                <option value="PAYMENT">💳 PAYMENT</option>
              </select>
            </div>
            <div className="field">
              <label>Voucher No.</label>
              <input
                name="vchNo"
                value={billForm.vchNo || billForm.billNo}
                onChange={updateBill}
                placeholder="DHRL/0001/26-27"
              />
            </div>
              <div className="field">
              <label>Bilty / LR No.</label>
              <input
                name="biltyNo"
                value={billForm.biltyNo || ""}
                onChange={updateBill}
                placeholder="Search ke liye Bilty No."
              />
              <small style={{ color: '#666', fontSize: '11px' }}>
                🔍 Is number se bill search kar sakte hain
              </small>
            </div>
            </div>
          <div className="sectionTitle">ITEM DETAILS</div>

          <div className="tableWrapper">
            <table>
                             <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '18%' }}>Particulars</th>
                  <th style={{ width: '10%' }}>Date</th>
                  <th style={{ width: '10%' }}>C.N. No.</th>
                  <th style={{ width: '12%' }}>Lorry No.</th>
                  <th style={{ width: '8%' }}>Act. Wt</th>
                  <th style={{ width: '8%' }}>Chg. Wt</th>
                  <th style={{ width: '10%' }}>Rate</th>
                  <th style={{ width: '12%' }}>Amount</th>
                  <th style={{ width: '7%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {billForm.items.map((item, index) => (
                                                     <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>
                      <input
                        value={item.description}
                        onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                        placeholder="Particulars"
                        style={{ marginBottom: '3px' }}
                      />
                      <input
                        value={item.subDescription || ""}
                        onChange={(e) => updateBillItem(index, 'subDescription', e.target.value)}
                        placeholder="Sub Description (Optional)"
                        style={{ fontSize: '11px', color: '#666' }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={item.date || billForm.date}
                        onChange={(e) => updateBillItem(index, 'date', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        value={item.cnNo || ""}
                        onChange={(e) => updateBillItem(index, 'cnNo', e.target.value)}
                        placeholder="C.N. No."
                      />
                    </td>
                    <td>
                      <input
                        value={item.lorryNo || ""}
                        onChange={(e) => updateBillItem(index, 'lorryNo', e.target.value)}
                        placeholder="Lorry No."
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.actualWeight || ""}
                        onChange={(e) => updateBillItem(index, 'actualWeight', parseFloat(e.target.value) || 0)}
                        placeholder="Wt"
                        step="0.001"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.chargeWeight || ""}
                        onChange={(e) => updateBillItem(index, 'chargeWeight', parseFloat(e.target.value) || 0)}
                        placeholder="Wt"
                        step="0.001"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateBillItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <strong>₹{money(item.amount)}</strong>
                    </td>
                    <td>
                      <button className="deleteBtn" onClick={() => removeBillItem(index)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="blueBtn" onClick={addBillItem} style={{ marginTop: '10px' }}>
            + ADD ITEM
          </button>

          <div className="sectionTitle">TAX & TOTAL</div>

          <div className="marginBox">
            <div>
              <span>Subtotal</span>
              <strong>₹{money(billForm.subtotal)}</strong>
            </div>
            <div>
              <span>CGST (2.5%)</span>
    <strong>₹{money(billForm.subtotal * 0.025)}</strong>
            </div>
            <div>
              <span>SGST (2.5%)</span>
    <strong>₹{money(billForm.subtotal * 0.025)}</strong>
            </div>
            <div style={{ background: '#102a43', color: 'white', padding: '10px', borderRadius: '6px' }}>
              <span style={{ color: 'white' }}>TOTAL</span>
              <strong style={{ color: 'white', fontSize: '22px' }}>₹{money(billForm.total)}</strong>
            </div>
          </div>

          <div className="field full">
            <label>Remarks</label>
            <textarea
              name="remarks"
              value={billForm.remarks}
              onChange={updateBill}
              placeholder="Any special instructions..."
            />
          </div>

          <div className="formButtons">
            {editingBill && (
              <button className="grayBtn" onClick={() => {
                setEditingBill(null);
                setBillForm(createEmptyBill());
              }}>
                CANCEL
              </button>
            )}
            <button className="greenBtn" onClick={saveBill}>
              {editingBill ? "UPDATE BILL" : "SAVE BILL"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="listHeader">
            <div>
              <h2>Bill / Invoice List</h2>
              <p>Total: {bills.length}</p>
            </div>
            <input
              className="search"
              placeholder="Search Bill / Party..."
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
            />
          </div>

          <div className="tableWrapper">
            <table>
                            <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Bilty No.</th>
                  <th>Vch No.</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(bill => (
                                    <tr key={bill.id}>
                    <td><strong>{bill.billNo}</strong></td>
                    <td>{bill.biltyNo || "-"}</td>
                    <td>{bill.vchNo || "-"}</td>
                    <td>{formatDate(bill.date)}</td>
                    <td>{bill.partyName}</td>
                    <td>{bill.items.length}</td>
                    <td><strong>₹{money(bill.subtotal || bill.total)}</strong></td>
                    <td>
                      <button className="editBtn" onClick={() => editBill(bill)}>EDIT</button>
                      <button className="printBtn" onClick={() => setPrintBill(bill)}>PRINT</button>
                      <button className="blueBtn" onClick={() => {
  setBillForm({
    ...createEmptyBill(),
    partyName: item.consignor || "",
    partyGST: item.consignorGST || "",
    partyAddress: item.consignorAddress || "",
    biltyNo: item.bilty,
    date: item.date || new Date().toISOString().slice(0, 10),
    items: [{
      id: Date.now(),
      description: `Lorry Freight - ${item.bilty}`,
      subDescription: `${item.pickup || ""} to ${item.delivery || ""}`,
      date: item.date || new Date().toISOString().slice(0, 10),
      cnNo: item.bilty,
      lorryNo: item.vehicle || "",
      actualWeight: item.actualWeight || "",
      chargeWeight: item.chargeWeight || "",
      rate: Number(item.freight || 0),
      amount: Number(item.freight || 0),
      hsn: "996519"
    }],
    subtotal: Number(item.freight || 0),
    cgst: 0,
    sgst: 0,
    total: Number(item.freight || 0),
    igstRate: 5
  });
  setEditingBill(null);
  setPage("bills");
  goTop();
}}>
  ⚡ BILL
</button>
                      <button className="deleteBtn" onClick={() => deleteBill(bill.id)}>DELETE</button>
                    
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

// =========================================================
// REPORTS PAGE
// =========================================================
  const renderReportsPage = () => {

    // =====================================================
    // REPORT SEARCH / FILTER HELPERS
    // =====================================================

    const reportSearchText = String(reportSearch || "").trim().toUpperCase();
    const reportMatches = (...values) => {
      if (!reportSearchText) return true;
      return values.some((value) =>
        String(value || "").toUpperCase().includes(reportSearchText)
      );
    };

    const reportDateMatches = (dateValue) => {
      if (!dateValue) return true;
      const date = String(dateValue).slice(0, 10);
      if (reportFromDate && date < reportFromDate) return false;
      if (reportToDate && date > reportToDate) return false;
      return true;
    };

    // =====================================================
    // FILTERED DATA
    // =====================================================

    const filteredBilties = bilties.filter((item) => {
      return (
        reportDateMatches(item.date) &&
        (!reportCustomer ||
          String(item.consignor || "").toUpperCase() === String(reportCustomer).toUpperCase() ||
          String(item.consignee || "").toUpperCase() === String(reportCustomer).toUpperCase()) &&
        reportMatches(item.bilty, item.consignor, item.consignee, item.pickup, item.delivery, item.vehicle, item.material)
      );
    });

    const filteredTrips = trips.filter((item) => {
      return (
        reportDateMatches(item.tripDate) &&
        (!reportBroker ||
          String(item.brokerName || "").toUpperCase() === String(reportBroker).toUpperCase()) &&
        reportMatches(item.tripNo, item.biltyNo, item.vehicleNo, item.driverName, item.brokerName, item.from, item.to, item.status)
      );
    });

    const filteredAccounts = accounts.filter((item) => {
      return (
        reportDateMatches(item.date) &&
        (!reportCustomer ||
          String(item.partyName || "").toUpperCase() === String(reportCustomer).toUpperCase()) &&
        reportMatches(item.partyName, item.referenceNo, item.moneyReceiptNo, item.billNo, item.type, item.category, item.paymentMode, item.remarks)
      );
    });

    const filteredVehicles = vehicles.filter((item) => {
      return reportMatches(item.vehicleNo, item.ownerName, item.vehicleType, item.driverName, item.driverMobile, item.rcNo);
    });
    
               // =====================================================
    // OUTSTANDING REPORT CALCULATION (BASED ON BILLS)
    // =====================================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sirf wahi Bills jo pending hain (Bill ke partyName se match karo)
    const outstandingBills = bills.filter((bill) => {
      if (!reportDateMatches(bill.date)) return false;
      
      const totalAmount = Number(bill.subtotal || bill.total || 0);
      const totalReceived = accounts
        .filter(acc => 
           String(acc.partyName || "").toUpperCase() === String(bill.partyName || "").toUpperCase()
        )
        .reduce((sum, acc) => sum + Number(acc.amount || 0), 0);
      
      const pending = totalAmount - totalReceived;
      return pending > 0;
    });

    const getOutstandingRows = () => {
      // Bill ke partyName se unique customers nikalo
      const uniqueCustomers = [...new Set(
        outstandingBills.flatMap(b => [b.partyName]).filter(Boolean)
      )];

      return uniqueCustomers.map(custName => {
        const custBills = outstandingBills.filter(b => 
          String(b.partyName || "").trim().toUpperCase() === String(custName || "").trim().toUpperCase()
        );
        
        let totals = { "0-30": 0, "30-60": 0, "60-120": 0, "120-180": 0, "180+": 0, "Total": 0 };
        let billRows = [];

        custBills.forEach(b => {
          const amount = Number(b.subtotal || b.total || 0);
          const received = accounts
            .filter(acc => acc.partyName === b.partyName)
            .reduce((sum, acc) => sum + Number(acc.amount || 0), 0);
          const pending = amount - received;

          if (pending > 0) {
            const billDate = new Date(b.date);
            const diffDays = Math.ceil(Math.abs(today - billDate) / (1000 * 60 * 60 * 24));
            let ageBucket = "180+";
            if (diffDays <= 30) ageBucket = "0-30";
            else if (diffDays <= 60) ageBucket = "30-60";
            else if (diffDays <= 120) ageBucket = "60-120";
            else if (diffDays <= 180) ageBucket = "120-180";

            totals[ageBucket] += pending;
            totals["Total"] += pending;

            // Bill details
            billRows.push({
              billNo: b.billNo || "-",
              biltyNo: b.biltyNo || "-",
              date: b.date,
              ageBucket: ageBucket,
              pending: pending,
              partyName: b.partyName,
              billType: b.billType || "TAX INVOICE",
              total: amount,
              received: received
            });
          }
        });
        return { customer: custName, totals, billRows };
      });
    };

    const outstandingRows = getOutstandingRows();
    // =====================================================
// PENDING BILTY BILL CALCULATION (FIXED - Bill Generated Filter)
// =====================================================
const pendingBilties = bilties.filter((item) => {
  // 1. Check Date
  if (!reportDateMatches(item.date)) return false;

  // 2. Check Customer Filter
  if (reportCustomer && 
      String(item.consignor).toUpperCase() !== String(reportCustomer).toUpperCase() && 
      String(item.consignee).toUpperCase() !== String(reportCustomer).toUpperCase()) {
    return false;
  }

  // =====================================================
  // 🔥 STEP 3: CHECK IF BILL ALREADY GENERATED
  // =====================================================
  const biltyNo = String(item.bilty || "").trim().toUpperCase();

  const billExists = bills.some((bill) => {
    // Direct match - bill.biltyNo field
    if (String(bill.biltyNo || "").trim().toUpperCase() === biltyNo) {
      return true;
    }

    // Match by Vch No (some bills use bilty no as vchNo)
    if (String(bill.vchNo || "").trim().toUpperCase() === biltyNo) {
      return true;
    }

    // Match by items - C.N. No. inside bill items
    if (Array.isArray(bill.items)) {
      return bill.items.some((billItem) => {
        const cnNo = String(billItem.cnNo || "").trim().toUpperCase();
        const desc = String(billItem.description || "").trim().toUpperCase();
        return (
          cnNo === biltyNo ||
          desc.includes(biltyNo)
        );
      });
    }

    return false;
  });

  // 🔥 Agar Bill already generate ho chuka hai toh PENDING list me mat dikhao
  if (billExists) return false;

  // =====================================================
  // STEP 4: CALCULATE PENDING AMOUNT
  // =====================================================
  const totalFreight = Number(item.freight || 0);
  
  const totalReceived = accounts
    .filter(acc => 
       String(acc.partyName).toUpperCase() === String(item.consignor).toUpperCase() || 
       String(acc.partyName).toUpperCase() === String(item.consignee).toUpperCase()
    )
    .reduce((sum, acc) => sum + Number(acc.amount || 0), 0);

  const pending = totalFreight - totalReceived;

  return pending > 0;
});
    
                    {/* =====================================================
            OUTSTANDING CUSTOMER REPORT (BILL BASED)
        ===================================================== */}

        {reportType === "OUTSTANDING" && (
          <div className="card" style={{ padding: '20px' }}>
            <div className="listHeader">
              <div>
                <h2 style={{ color: '#102a43' }}>📊 Customer Outstanding Report</h2>
                <p>Ageing Analysis (Bill ke partyName se)</p>
              </div>
            </div>

            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Customer Name</th>
                    <th style={{ textAlign: 'left' }}>Bill No.</th>
                    <th style={{ textAlign: 'left' }}>Bilty No.</th>
                    <th style={{ textAlign: 'left' }}>Bill Date</th>
                    <th>0-30 Days</th>
                    <th>30-60 Days</th>
                    <th>60-120 Days</th>
                    <th>120-180 Days</th>
                    <th>180+ Days</th>
                    <th>Pending Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingRows.length > 0 ? (
                    outstandingRows.map((row, index) => (
                      <>
                        <tr style={{ background: '#f0f8ff', fontWeight: 'bold' }}>
                          <td colSpan="4">{row.customer}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["0-30"])}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["30-60"])}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["60-120"])}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["120-180"])}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["180+"])}</td>
                          <td style={{ textAlign: 'center', background: '#fff8e1' }}>₹{money(row.totals.Total)}</td>
                          <td></td>
                        </tr>

                        {row.billRows.map((bill, billIndex) => (
                          <tr key={`${index}-${billIndex}`}>
                            <td></td>
                            <td>{bill.billNo}</td>
                            <td>{bill.biltyNo}</td>
                            <td>{formatDate(bill.date)}</td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "0-30" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "30-60" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "60-120" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "120-180" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "180+" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>₹{money(bill.pending)}</td>
                            <td>
                              <button
                                className="printBtn"
                                onClick={() => {
                                  const printWindow = window.open('', '_blank', 'width=800,height=600');
                                  if (!printWindow) {
                                    alert("Popup blocked! Please allow popups.");
                                    return;
                                  }
                                  printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Bill Print - ${bill.billNo || "-"}</title>
                                        <style>
                                          body { font-family: Arial, sans-serif; margin: 30px; }
                                          h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                          th, td { border: 1px solid #000; padding: 10px; text-align: left; }
                                          th { background: #f0f0f0; }
                                          .right { text-align: right; }
                                        </style>
                                      </head>
                                      <body>
                                        <h2>Outstanding Bill Report</h2>
                                        <table>
                                          <tr><th>Bill No:</th><td>${bill.billNo || "-"}</td></tr>
                                          <tr><th>Bilty No:</th><td>${bill.biltyNo || "-"}</td></tr>
                                          <tr><th>Date:</th><td>${formatDate(bill.date)}</td></tr>
                                          <tr><th>Party Name:</th><td>${bill.partyName}</td></tr>
                                          <tr><th>Bill Type:</th><td>${bill.billType}</td></tr>
                                          <tr><th>Total Amount:</th><td class="right">₹${money(bill.total)}</td></tr>
                                          <tr><th>Received:</th><td class="right">₹${money(bill.received)}</td></tr>
                                          <tr><th style="background:#c62828; color:white;">Pending Amount:</th><td class="right" style="background:#c62828; color:white; font-weight:bold;">₹${money(bill.pending)}</td></tr>
                                        </table>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                  printWindow.focus();
                                  printWindow.print();
                                }}
                              >
                                🖨️ PRINT
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '20px' }}>
                        ✅ Sabhi customers ka bill clear hai. Koi outstanding nahi hai.
                      </td>
                    </tr>
                  )}
                </tbody>

                {outstandingRows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#102a43', color: 'white' }}>
                      <th colSpan="4" style={{ color: 'white' }}>GRAND TOTAL</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["0-30"], 0))}</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["30-60"], 0))}</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["60-120"], 0))}</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["120-180"], 0))}</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["180+"], 0))}</th>
                      <th style={{ background: '#c62828', color: 'white', fontWeight: 'bold' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals.Total, 0))}</th>
                      <th></th>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
    // =====================================================
    // PENDING BILTY BILL GENERATE
    // =====================================================

            {reportType === "PENDING_BILL" && (
          <div className="card" style={{ padding: '20px' }}>
            <div className="listHeader">
              <div>
                <h2 style={{ color: '#c62828' }}>⏳ Pending Bilty Bill</h2>
                <p>Total Pending: {pendingBilties.length}</p>
              </div>
            </div>

            {pendingBilties.length === 0 && (
              <div className="empty" style={{ 
                padding: '40px', 
                textAlign: 'center',
                background: '#f0f8f0',
                borderRadius: '8px',
                border: '2px solid #16855b'
              }}>
                <h3 style={{ color: '#16855b', margin: '0 0 10px 0' }}>✅ All Bills Generated!</h3>
                <p style={{ color: '#555', margin: '0' }}>
                  Sabhi pending bilties ke bills generate ho chuke hain.
                  <br />
                  Koi pending bilty nahi hai.
                </p>
              </div>
            )}

            {pendingBilties.length > 0 && (
              <div className="tableWrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Bilty No.</th>
                      <th>Date</th>
                      <th>Consignor</th>
                      <th>Consignee</th>
                      <th>Total Freight</th>
                      <th>Received</th>
                      <th>Pending</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBilties.map((item) => {
                      const totalFreight = Number(item.freight || 0);
                      const totalReceived = accounts
                        .filter(acc => acc.partyName === item.consignor || acc.partyName === item.consignee)
                        .reduce((sum, acc) => sum + Number(acc.amount || 0), 0);
                      const pending = totalFreight - totalReceived;
                      
                      const customer = customers.find(c => c.name === item.consignor);
                      
                      return (
                        <tr key={item.id}>
                          <td><strong>{item.bilty}</strong></td>
                          <td>{formatDate(item.date)}</td>
                          <td>{item.consignor}</td>
                          <td>{item.consignee}</td>
                          <td>₹{money(totalFreight)}</td>
                          <td>₹{money(totalReceived)}</td>
                          <td><strong style={{ color: '#c62828' }}>₹{money(pending)}</strong></td>
                          <td><span className="statusInactive">{item.status || "Pending"}</span></td>
                          <td>
                            <button
                              className="printBtn"
                              onClick={() => {
                                setPendingBillData({
                                  partyName: customer?.name || item.consignor || "",
                                  partyGST: customer?.gst || "",
                                  partyAddress: customer?.address || "",
                                  biltyNo: item.bilty,
                                  biltyId: item.id,
                                  totalFreight: totalFreight,
                                  received: totalReceived,
                                  pending: pending,
                                  items: [{
                                    id: Date.now(),
                                    description: `Lorry Freight - ${item.bilty}`,
                                    subDescription: `${item.pickup || ""} to ${item.delivery || ""}`,
                                    date: item.date || new Date().toISOString().slice(0, 10),
                                    cnNo: item.bilty,
                                    lorryNo: item.vehicle || "",
                                    actualWeight: item.actualWeight || "",
                                    chargeWeight: item.chargeWeight || "",
                                    rate: pending || 0,
                                    amount: pending || 0,
                                    hsn: "996519"
                                  }]
                                });
                                setShowBillGenerateModal(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#1769aa',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}
                            >
                              ⚡ Generate Bill
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
    const customersList = [...new Set(customers.map((item) => item.name).filter(Boolean))];
    const brokersList = [...new Set(trips.map((item) => item.brokerName).filter(Boolean))];

    const resetReportFilters = () => {
      setReportSearch("");
      setReportFromDate("");
      setReportToDate("");
      setReportCustomer("");
      setReportBroker("");
      setReportPeriod("DAY");
    };

      // =========================================================
  // EXCEL EXPORT HANDLER
  // =========================================================

  const handleExportExcel = () => {
    let data = [];
    let filename = "";
    let headers = [];

    if (reportType === "BILTY") {
      data = filteredBilties;
      filename = "Bilty_Report";
      headers = [
        { key: 'bilty', label: 'Bilty No.' },
        { key: 'date', label: 'Date' },
        { key: 'consignor', label: 'Consignor' },
        { key: 'consignee', label: 'Consignee' },
        { key: 'pickup', label: 'From' },
        { key: 'delivery', label: 'To' },
        { key: 'freight', label: 'Freight' },
        { key: 'status', label: 'Status' },
      ];
    } 
    else if (reportType === "CUSTOMER") {
      data = filteredBilties.filter((item) => {
        if (!reportCustomer) return true;
        const c = String(reportCustomer).toUpperCase();
        return String(item.consignor).toUpperCase() === c || String(item.consignee).toUpperCase() === c;
      });
      filename = "Customer_Report";
      headers = [
        { key: 'bilty', label: 'Bilty No.' },
        { key: 'date', label: 'Date' },
        { key: 'consignor', label: 'Consignor' },
        { key: 'consignee', label: 'Consignee' },
        { key: 'freight', label: 'Freight' },
      ];
    }
    else if (reportType === "TRIP") {
      data = filteredTrips;
      filename = "Trip_Report";
      headers = [
        { key: 'tripNo', label: 'Trip No.' },
        { key: 'tripDate', label: 'Date' },
        { key: 'biltyNo', label: 'Bilty No.' },
        { key: 'vehicleNo', label: 'Vehicle' },
        { key: 'driverName', label: 'Driver' },
        { key: 'brokerName', label: 'Broker' },
        { key: 'lorryFreight', label: 'Lorry Freight' },
        { key: 'status', label: 'Status' },
      ];
    }
    else if (reportType === "RECEIPT") {
      data = filteredAccounts.filter(item => item.type === "RECEIPT");
      filename = "Receipt_Report";
      headers = [
        { key: 'date', label: 'Date' },
        { key: 'moneyReceiptNo', label: 'Receipt No.' },
        { key: 'partyName', label: 'Customer' },
        { key: 'amount', label: 'Amount' },
      ];
    }
    else if (reportType === "LORRY") {
      data = filteredVehicles;
      filename = "Vehicle_Report";
      headers = [
        { key: 'vehicleNo', label: 'Vehicle No.' },
        { key: 'ownerName', label: 'Owner' },
        { key: 'vehicleType', label: 'Type' },
        { key: 'driverName', label: 'Driver' },
        { key: 'status', label: 'Status' },
      ];
    }
    else {
      alert("❌ Export not supported for this report type.");
      return;
    }

    if (data.length === 0) {
      alert("❌ No data found with current filters.");
      return;
    }

    exportToExcel(data, filename, headers);
  };

    return (
      <>

                      {/* =====================================================
            OUTSTANDING CUSTOMER REPORT (AGEING) - WITH BILL NO.
        ===================================================== */}

        {reportType === "OUTSTANDING" && (
          <div className="card" style={{ padding: '20px' }}>
            <div className="listHeader">
              <div>
                <h2 style={{ color: '#102a43' }}>📊 Customer Outstanding Report</h2>
                <p>Ageing Analysis (Bill No. ke saath)</p>
              </div>
            </div>

            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Customer Name</th>
                    <th style={{ textAlign: 'left' }}>Bill No.</th>
                    <th style={{ textAlign: 'left' }}>Bill Date</th>
                    <th>0-30 Days</th>
                    <th>30-60 Days</th>
                    <th>60-120 Days</th>
                    <th>120-180 Days</th>
                    <th>180+ Days</th>
                    <th>Pending Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingRows.length > 0 ? (
                    outstandingRows.map((row, index) => (
                      <>
                        {/* Customer ka Total Row */}
                        <tr style={{ background: '#f0f8ff', fontWeight: 'bold' }}>
                          <td colSpan="3">{row.customer}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["0-30"])}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["30-60"])}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["60-120"])}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["120-180"])}</td>
                          <td style={{ textAlign: 'center' }}>₹{money(row.totals["180+"])}</td>
                          <td style={{ textAlign: 'center', background: '#fff8e1' }}>₹{money(row.totals.Total)}</td>
                          <td></td>
                        </tr>

                        {/* Har Bill ki Row */}
                        {row.billRows.map((bill, billIndex) => (
                          <tr key={`${index}-${billIndex}`}>
                            <td></td>
                            <td>{bill.billNo}</td>
                            <td>{formatDate(bill.date)}</td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "0-30" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "30-60" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "60-120" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "120-180" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {bill.ageBucket === "180+" ? `₹${money(bill.pending)}` : "-"}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>₹{money(bill.pending)}</td>
                            <td>
                              {/* Bill Print Button */}
                              <button
                                className="printBtn"
                                onClick={() => {
                                  const printWindow = window.open('', '_blank', 'width=800,height=600');
                                  if (!printWindow) {
                                    alert("Popup blocked! Please allow popups.");
                                    return;
                                  }

                                  printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Bill Print - ${bill.billNo || bill.biltyNo}</title>
                                        <style>
                                          body { font-family: Arial, sans-serif; margin: 30px; }
                                          h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                          th, td { border: 1px solid #000; padding: 10px; text-align: left; }
                                          th { background: #f0f0f0; }
                                          .right { text-align: right; }
                                        </style>
                                      </head>
                                      <body>
                                        <h2>Outstanding Bill Report</h2>
                                        <table>
                                          <tr><th>Bill No:</th><td>${bill.billNo || "-"}</td></tr>
                                          <tr><th>Bilty No:</th><td>${bill.biltyNo || "-"}</td></tr>
                                          <tr><th>Date:</th><td>${formatDate(bill.date)}</td></tr>
                                          <tr><th>Consignor:</th><td>${bill.consignor}</td></tr>
                                          <tr><th>Consignee:</th><td>${bill.consignee}</td></tr>
                                          <tr><th>Vehicle:</th><td>${bill.vehicle}</td></tr>
                                          <tr><th>Total Freight:</th><td class="right">₹${money(bill.freight)}</td></tr>
                                          <tr><th>Received:</th><td class="right">₹${money(bill.received)}</td></tr>
                                          <tr><th style="background:#c62828; color:white;">Pending Amount:</th><td class="right" style="background:#c62828; color:white; font-weight:bold;">₹${money(bill.pending)}</td></tr>
                                        </table>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                  printWindow.focus();
                                  printWindow.print();
                                }}
                              >
                                🖨️ PRINT
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
                        ✅ Sabhi customers ka bill clear hai. Koi outstanding nahi hai.
                      </td>
                    </tr>
                  )}
                </tbody>

                {outstandingRows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#102a43', color: 'white' }}>
                      <th colSpan="3" style={{ color: 'white' }}>GRAND TOTAL</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["0-30"], 0))}</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["30-60"], 0))}</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["60-120"], 0))}</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["120-180"], 0))}</th>
                      <th style={{ color: 'white' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals["180+"], 0))}</th>
                      <th style={{ background: '#c62828', color: 'white', fontWeight: 'bold' }}>₹{money(outstandingRows.reduce((s, r) => s + r.totals.Total, 0))}</th>
                      <th></th>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
        {/* =====================================================
            REPORT PAGE HEADER - PROFESSIONAL
        ===================================================== */}

        <div className="pageTitle" style={{
          background: 'linear-gradient(135deg, #102a43 0%, #1a3a5c 100%)',
          padding: '25px 30px',
          borderRadius: '10px',
          color: 'white',
          marginBottom: '25px'
        }}>
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>📊 Reports Dashboard</h2>
            <p style={{ color: '#b8d4e8', margin: '5px 0 0', fontSize: '13px' }}>
              Business Reports, Ledger, Bilty, Bill, Money Receipt, Lorry & Trip Reports
            </p>
          </div>
        </div>

        {/* =====================================================
            REPORT CATEGORY - PROFESSIONAL GRID
        ===================================================== */}

        <div className="card" style={{ padding: '20px' }}>
          <div className="sectionTitle" style={{
            fontSize: '14px',
            fontWeight: '800',
            color: '#102a43',
            marginBottom: '15px'
          }}>
            📋 REPORT CATEGORY
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <button
              type="button"
              className={reportType === "BILTY" ? "blueBtn" : ""}
              onClick={() => { setReportType("BILTY"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "BILTY" ? '#1769aa' : 'white',
                color: reportType === "BILTY" ? 'white' : '#334e68',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              🚚 Bilty Reports
            </button>

            <button
              type="button"
              className={reportType === "CUSTOMER" ? "blueBtn" : ""}
              onClick={() => { setReportType("CUSTOMER"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "CUSTOMER" ? '#1769aa' : 'white',
                color: reportType === "CUSTOMER" ? 'white' : '#334e68',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              👤 Customer Reports
            </button>

            <button
              type="button"
              className={reportType === "BROKER" ? "blueBtn" : ""}
              onClick={() => { setReportType("BROKER"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "BROKER" ? '#1769aa' : 'white',
                color: reportType === "BROKER" ? 'white' : '#334e68',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              🤝 Broker Reports
            </button>

            <button
              type="button"
              className={reportType === "BILL" ? "blueBtn" : ""}
              onClick={() => { setReportType("BILL"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "BILL" ? '#1769aa' : 'white',
                color: reportType === "BILL" ? 'white' : '#334e68',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              🧾 Bill Reports
            </button>

            <button
              type="button"
              className={reportType === "RECEIPT" ? "blueBtn" : ""}
              onClick={() => { setReportType("RECEIPT"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "RECEIPT" ? '#1769aa' : 'white',
                color: reportType === "RECEIPT" ? 'white' : '#334e68',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              💰 Money Receipt
            </button>

            <button
              type="button"
              className={reportType === "LORRY" ? "blueBtn" : ""}
              onClick={() => { setReportType("LORRY"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "LORRY" ? '#1769aa' : 'white',
                color: reportType === "LORRY" ? 'white' : '#334e68',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              🚛 Lorry Reports
            </button>

            <button
              type="button"
              className={reportType === "CUSTOMER_SUMMARY" ? "blueBtn" : ""}
              onClick={() => { setReportType("CUSTOMER_SUMMARY"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "CUSTOMER_SUMMARY" ? '#1769aa' : 'white',
                color: reportType === "CUSTOMER_SUMMARY" ? 'white' : '#334e68',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              📊 Customer Summary
            </button>

            <button
              type="button"
              className={reportType === "TRIP" ? "blueBtn" : ""}
              onClick={() => { setReportType("TRIP"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "TRIP" ? '#1769aa' : 'white',
                color: reportType === "TRIP" ? 'white' : '#334e68',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              📦 Trip Reports
            </button>

            {/* ===== NEW: PENDING BILTY BILL GENERATE ===== */}
            <button
              type="button"
              className={reportType === "PENDING_BILL" ? "blueBtn" : ""}
              onClick={() => { setReportType("PENDING_BILL"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "PENDING_BILL" ? '#c62828' : 'white',
                color: reportType === "PENDING_BILL" ? 'white' : '#c62828',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
                borderColor: reportType === "PENDING_BILL" ? '#c62828' : '#c62828'
              }}
            >
              ⏳ Pending Bilty Bill
            </button>
          </div>
        </div>

                    {/* ===== NEW: CUSTOMER OUTSTANDING ===== */}
            <button
              type="button"
              className={reportType === "OUTSTANDING" ? "blueBtn" : ""}
              onClick={() => { setReportType("OUTSTANDING"); resetReportFilters(); }}
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                border: '2px solid #dfe6ed',
                background: reportType === "OUTSTANDING" ? '#102a43' : 'white',
                color: reportType === "OUTSTANDING" ? 'white' : '#102a43',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              📊 Customer Outstanding
            </button>

        {/* =====================================================
            REPORT FILTERS - PROFESSIONAL
        ===================================================== */}

        <div className="card" style={{ padding: '20px' }}>
          <div className="sectionTitle" style={{
            fontSize: '14px',
            fontWeight: '800',
            color: '#102a43',
            marginBottom: '15px'
          }}>
            🔍 REPORT FILTERS
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Report Period</label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                style={{ height: '42px', padding: '0 12px', width: '100%' }}
              >
                <option value="DAY">Day Wise</option>
                <option value="MONTH">Month Wise</option>
                <option value="YEAR">Year Wise</option>
                <option value="CUSTOM">Custom Date</option>
              </select>
            </div>

            <div className="field">
              <label>From Date</label>
              <input
                type="date"
                value={reportFromDate}
                onChange={(e) => setReportFromDate(e.target.value)}
                style={{ height: '42px', padding: '0 12px', width: '100%' }}
              />
            </div>

            <div className="field">
              <label>To Date</label>
              <input
                type="date"
                value={reportToDate}
                onChange={(e) => setReportToDate(e.target.value)}
                style={{ height: '42px', padding: '0 12px', width: '100%' }}
              />
            </div>

            <div className="field">
              <label>Customer</label>
              <select
                value={reportCustomer}
                onChange={(e) => setReportCustomer(e.target.value)}
                style={{ height: '42px', padding: '0 12px', width: '100%' }}
              >
                <option value="">All Customers</option>
                {customersList.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Broker</label>
              <select
                value={reportBroker}
                onChange={(e) => setReportBroker(e.target.value)}
                style={{ height: '42px', padding: '0 12px', width: '100%' }}
              >
                <option value="">All Brokers</option>
                {brokersList.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Search</label>
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search Bilty / Bill / Customer / Vehicle..."
                style={{ height: '42px', padding: '0 12px', width: '100%' }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '18px',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              className="blueBtn"
              onClick={resetReportFilters}
              style={{ padding: '10px 24px' }}
            >
              🔄 RESET FILTER
            </button>

                          {/* ============ PRINT REPORT BUTTON ============ */}
            <button
              type="button"
              onClick={() => {
                const totalData = filteredBilties.length + filteredTrips.length + filteredAccounts.length + filteredVehicles.length;
                if (totalData === 0) {
                  alert("❌ No data to print! Please apply filters first.");
                  return;
                }

                // 1. Naya popup window kholo
                const printWindow = window.open('', '_blank', 'width=1000,height=700');
                if (!printWindow) {
                  alert("Popup blocked! Please allow popups for this site.");
                  return;
                }

                // 2. Window mein HTML likho
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Business Report</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h2 { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #333; padding: 8px; font-size: 12px; text-align: left; }
                        th { background: #f0f0f0; }
                      </style>
                    </head>
                    <body>
                      <h2>📊 Report</h2>
                      <!-- Yahan hum directly table ka HTML inject kar rahe hain -->
                      <div id="printArea"></div>
                    </body>
                  </html>
                `);
                
                printWindow.document.close();

                // 3. Current page se table ka HTML copy karke new window mein daalo
                setTimeout(() => {
                  const tables = document.querySelectorAll('.content table');
                  let tableHTML = '';
                  tables.forEach(table => {
                    tableHTML += table.outerHTML;
                  });
                  
                  // HTML inject karo
                  const printDiv = printWindow.document.getElementById('printArea');
                  if (printDiv) {
                    printDiv.innerHTML = tableHTML;
                    
                    // Print command run karo
                    printWindow.focus();
                    printWindow.print();
                  }
                }, 500); // 500ms wait karo taaki window load ho jaye
              }}
              style={{
                padding: '10px 24px',
                background: '#16855b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🖨️ PRINT REPORT
            </button>

            <button
  type="button"
  className="blueBtn"
  onClick={handleExportExcel}
  style={{ padding: '10px 24px', background: '#16855b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
>
  📊 EXPORT EXCEL
</button>
          </div>
        </div>

        {/* =====================================================
            PENDING BILTY BILL GENERATE - REPORT
        ===================================================== */}

                {reportType === "PENDING_BILL" && (
          <div className="card" style={{ padding: '20px' }}>
            <div className="listHeader">
              <div>
                <h2 style={{ color: '#c62828' }}>⏳ Pending Bilty Bill</h2>
                <p>Total Pending: {pendingBilties.length}</p>
              </div>
            </div>

            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Bilty No.</th>
                    <th>Date</th>
                    <th>Consignor</th>
                    <th>Consignee</th>
                    <th>Total Freight</th>
                    <th>Received</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBilties.length > 0 ? (
                    pendingBilties.map((item) => {
                      const totalFreight = Number(item.freight || 0);
                      const totalReceived = accounts
                        .filter(acc => acc.partyName === item.consignor || acc.partyName === item.consignee)
                        .reduce((sum, acc) => sum + Number(acc.amount || 0), 0);
                      const pending = totalFreight - totalReceived;
                      
                      // Get customer details for pre-fill
                      const customer = customers.find(c => c.name === item.consignor);
                      
                      return (
                        <tr key={item.id}>
                          <td><strong>{item.bilty}</strong></td>
                          <td>{formatDate(item.date)}</td>
                          <td>{item.consignor}</td>
                          <td>{item.consignee}</td>
                          <td>₹{money(totalFreight)}</td>
                          <td>₹{money(totalReceived)}</td>
                          <td><strong style={{ color: '#c62828' }}>₹{money(pending)}</strong></td>
                          <td><span className="statusInactive">{item.status || "Pending"}</span></td>
                          <td>
                            <button
                              className="printBtn"
                              onClick={() => {
                                // Pre-fill data from customer master
                                setPendingBillData({
                                  partyName: customer?.name || item.consignor || "",
                                  partyGST: customer?.gst || "",
                                  partyAddress: customer?.address || "",
                                  biltyNo: item.bilty,
                                  biltyId: item.id,
                                  totalFreight: totalFreight,
                                  received: totalReceived,
                                  pending: pending,
                                  items: [{
                                    id: Date.now(),
                                    description: `Lorry Freight - ${item.bilty}`,
                                    subDescription: `${item.pickup || ""} to ${item.delivery || ""}`,
                                    date: item.date || new Date().toISOString().slice(0, 10),
                                    cnNo: item.bilty,
                                    lorryNo: item.vehicle || "",
                                    actualWeight: item.actualWeight || "",
                                    chargeWeight: item.chargeWeight || "",
                                    rate: pending || 0,
                                    amount: pending || 0,
                                    hsn: "996519"
                                  }]
                                });
                                setShowBillGenerateModal(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#1769aa',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}
                            >
                              ⚡ Generate Bill
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="empty">No pending bilties found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* =====================================================
            OTHER REPORT TYPES - (Keep existing code here)
        ===================================================== */}

        {/* BILTY REPORT */}
        {reportType === "BILTY" && (
          <div className="card">
            <div className="listHeader">
              <div>
                <h2>🚚 Bilty Report</h2>
                <p>Total Bilty: {filteredBilties.length}</p>
              </div>
            </div>
            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bilty No.</th>
                    <th>Consignor</th>
                    <th>Consignee</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Vehicle</th>
                    <th>Freight</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBilties.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.date)}</td>
                      <td><strong>{item.bilty}</strong></td>
                      <td>{item.consignor}</td>
                      <td>{item.consignee}</td>
                      <td>{item.pickup}</td>
                      <td>{item.delivery}</td>
                      <td>{item.vehicle}</td>
                      <td>₹{money(item.freight)}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMER REPORT */}
        {reportType === "CUSTOMER" && (
          <div className="card">
            <div className="listHeader">
              <div>
                <h2>👤 Customer Report</h2>
                <p>Customer wise Bilty Details</p>
              </div>
            </div>
            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bilty No.</th>
                    <th>Customer</th>
                    <th>Consignee</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Freight</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBilties.filter((item) => {
                    if (!reportCustomer) return true;
                    const customer = String(reportCustomer).trim().toUpperCase();
                    return String(item.consignor || "").trim().toUpperCase() === customer ||
                           String(item.consignee || "").trim().toUpperCase() === customer;
                  }).map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.date)}</td>
                      <td><strong>{item.bilty}</strong></td>
                      <td>{item.consignor}</td>
                      <td>{item.consignee}</td>
                      <td>{item.pickup}</td>
                      <td>{item.delivery}</td>
                      <td>₹{money(item.freight)}</td>
                      <td>{item.ewayBillNo || "-"}</td>
                    <td>₹{money(item.materialValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BROKER REPORT */}
        {reportType === "BROKER" && (
          <div className="card">
            <div className="listHeader">
              <div>
                <h2>🤝 Broker Report</h2>
                <p>Broker wise Trip Details</p>
              </div>
            </div>
            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Trip No.</th>
                    <th>Bilty No.</th>
                    <th>Broker</th>
                    <th>Vehicle</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Lorry Hire</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.filter((item) => {
                    if (!reportBroker) return true;
                    return String(item.brokerName || "").trim().toUpperCase() === String(reportBroker).trim().toUpperCase();
                  }).map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.tripDate)}</td>
                      <td><strong>{item.tripNo}</strong></td>
                      <td>{item.biltyNo}</td>
                      <td>{item.brokerName}</td>
                      <td>{item.vehicleNo}</td>
                      <td>{item.from}</td>
                      <td>{item.to}</td>
                      <td>₹{money(item.lorryFreight)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RECEIPT REPORT */}
        {reportType === "RECEIPT" && (
          <div className="card">
            <div className="listHeader">
              <div>
                <h2>💰 Money Receipt Report</h2>
                <p>Total Receipt: {filteredAccounts.filter(item => item.type === "RECEIPT").length}</p>
              </div>
            </div>
            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Money Receipt No.</th>
                    <th>Customer</th>
                    <th>Payment Mode</th>
                    <th>Reference</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.filter(item => item.type === "RECEIPT").map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.date)}</td>
                      <td><strong>{item.moneyReceiptNo || "-"}</strong></td>
                      <td>{item.partyName}</td>
                      <td>{item.paymentMode}</td>
                      <td>{item.referenceNo || "-"}</td>
                      <td>₹{money(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LORRY REPORT */}
        {reportType === "LORRY" && (
          <div className="card">
            <div className="listHeader">
              <div>
                <h2>🚛 Lorry / Vehicle Report</h2>
                <p>Vehicle wise owner details</p>
              </div>
            </div>
            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle No.</th>
                    <th>Owner Name</th>
                    <th>Vehicle Type</th>
                    <th>Capacity</th>
                    <th>Driver</th>
                    <th>Driver Mobile</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.vehicleNo}</strong></td>
                      <td>{item.ownerName}</td>
                      <td>{item.vehicleType}</td>
                      <td>{item.capacity}</td>
                      <td>{item.driverName}</td>
                      <td>{item.driverMobile}</td>
                      <td><span className={item.status === "Active" ? "statusActive" : "statusInactive"}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

                // =========================================================
// CUSTOMER SUMMARY WITH MARGIN ANALYSIS & ALL DETAILS
// =========================================================
{reportType === "CUSTOMER_SUMMARY" && (
  <div className="card">
    <div className="listHeader">
      <div>
        <h2 style={{ color: '#102a43' }}>📊 Customer Summary with Complete Details</h2>
        <p>
          {reportPeriod === "DAY" && "📅 Day Wise"}
          {reportPeriod === "MONTH" && "📆 Month Wise"}
          {reportPeriod === "YEAR" && "📅 Year Wise"}
          {reportPeriod === "CUSTOM" && "📅 Custom Date"}
          {reportFromDate && reportToDate && ` (${formatDate(reportFromDate)} to ${formatDate(reportToDate)})`}
        </p>
      </div>
    </div>

    <div className="tableWrapper" style={{ overflowX: 'auto' }}>
      <table style={{ minWidth: '1400px', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'center', width: '5%' }}>#</th>
            <th style={{ textAlign: 'left', width: '12%' }}>Bilty No.</th>
            <th style={{ textAlign: 'left', width: '10%' }}>Date</th>
            <th style={{ textAlign: 'left', width: '12%' }}>Lorry No.</th>
            <th style={{ textAlign: 'left', width: '18%' }}>Party Name</th>
            <th style={{ textAlign: 'right', width: '10%' }}>Bill Amt (₹)</th>
            <th style={{ textAlign: 'right', width: '10%' }}>Lorry Hire (₹)</th>
            <th style={{ textAlign: 'right', width: '10%' }}>Advance (₹)</th>
            <th style={{ textAlign: 'right', width: '10%' }}>Balance (₹)</th>
            <th style={{ textAlign: 'right', width: '10%' }}>Halting (₹)</th>
            <th style={{ textAlign: 'center', width: '8%' }}>Balance Paid</th>
            <th style={{ textAlign: 'right', width: '10%' }}>Deduction (₹)</th>
            <th style={{ textAlign: 'right', width: '10%' }}>Margin (₹)</th>
            <th style={{ textAlign: 'right', width: '10%' }}>Margin %</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            // =============================================
            // 1. FILTER BILTIES BY DATE
            // =============================================
            let filteredBiltiesForSummary = bilties.filter((item) => {
              if (reportFromDate && item.date < reportFromDate) return false;
              if (reportToDate && item.date > reportToDate) return false;
              
              if (reportPeriod === "MONTH" && reportFromDate) {
                const itemMonth = item.date?.slice(0, 7);
                const filterMonth = reportFromDate.slice(0, 7);
                if (itemMonth !== filterMonth) return false;
              }
              if (reportPeriod === "YEAR" && reportFromDate) {
                const itemYear = item.date?.slice(0, 4);
                const filterYear = reportFromDate.slice(0, 4);
                if (itemYear !== filterYear) return false;
              }
              return true;
            });

            // =============================================
            // 2. GROUP BY CUSTOMER (Consignor)
            // =============================================
            const customerMap = new Map();

            filteredBiltiesForSummary.forEach((bilty) => {
              const customerName = bilty.consignor || "Unknown";
              
              if (!customerMap.has(customerName)) {
                customerMap.set(customerName, {
  customer: customerName,
  bilties: [],
  totalBookingFreight: 0,
  totalLorryHire: 0,
  totalAdvance: 0,
  totalHalting: 0,
  totalDeduction: 0,
  totalMargin: 0,
  totalChallanDeduction: 0,   // 🔥 NAYA
  count: 0
});
              }
              
              const customerData = customerMap.get(customerName);
              
              // Find trip for this bilty
              const trip = trips.find((t) => String(t.biltyId) === String(bilty.id));
              
              // Calculate values
              const bookingFreight = Number(bilty.freight || 0);
              const lorryHire = trip ? Number(trip.lorryFreight || 0) : 0;
              const advance = trip ? Number(trip.advance || 0) : 0;
              
              // HALTING = Halting Addition - Halting Deduction
              const haltingAddition = trip ? Number(trip.haltingAddition || 0) : 0;
              const haltingDeduction = trip ? Number(trip.haltingDeduction || 0) : 0;
              const haltingNet = haltingAddition - haltingDeduction;
              
              // OTHER = Other Addition (Commission - NOT added to margin)
              const otherAddition = trip ? Number(trip.otherAddition || 0) : 0;
              
              // DEDUCTION = Damage Deduction + Other Deduction + Halting Deduction
              const damageDeduction = trip ? Number(trip.damageDeduction || 0) : 0;
              const otherDeduction = trip ? Number(trip.otherDeduction || 0) : 0;
              const totalDeduction = damageDeduction + otherDeduction + haltingDeduction;
              
              // CORRECTED LORRY HIRE = Original Lorry Hire + Halting Net + Other Addition (Commission)
              // Other Addition (Commission) is added to Lorry Hire but NOT to Margin
              const correctedLorryHire = lorryHire + haltingNet + otherAddition;
              
              // 🔥 Challan & Bilty Deduction (LHB entry se)
const challanBiltyDeduction = trip ? Number(trip.challanBiltyDeduction || trip.lhbOther || 0) : 0;

              // Balance = Corrected Lorry Hire - Advance
              const balance = correctedLorryHire - advance;
              
              // 🔥 MARGIN = Booking - Corrected Lorry Hire + Challan Deduction
// Challan Deduction aapki company ka profit badhata hai
const margin = bookingFreight - correctedLorryHire + challanBiltyDeduction;

              // Check if balance is paid (from LHB records)
              const lhbCash = trip ? Number(trip.lhbCash || 0) : 0;
              const lhbBank = trip ? Number(trip.lhbBank || 0) : 0;
              const lhbOther = trip ? Number(trip.lhbOther || 0) : 0;
              const totalPaid = lhbCash + lhbBank + lhbOther;
              const balancePaid = totalPaid >= balance && balance > 0 ? "✅ YES" : balance <= 0 ? "✅ YES" : "⏳ NO";
              
              // Margin %
              const marginPercent = bookingFreight > 0 ? (margin / bookingFreight) * 100 : 0;
              
              customerData.bilties.push({
                bilty: bilty,
                trip: trip,
                bookingFreight: bookingFreight,
                lorryHire: lorryHire,
                correctedLorryHire: correctedLorryHire,
                advance: advance,
                  challanBiltyDeduction: challanBiltyDeduction,
                balance: balance,
                haltingNet: haltingNet,
                haltingAddition: haltingAddition,
                haltingDeduction: haltingDeduction,
                otherAddition: otherAddition,
                totalDeduction: totalDeduction,
                damageDeduction: damageDeduction,
                otherDeduction: otherDeduction,
                margin: margin,
                marginPercent: marginPercent,
                balancePaid: balancePaid,
                totalPaid: totalPaid,
                vehicleNo: trip?.vehicleNo || bilty.vehicle || "-",
                status: trip?.status || bilty.status || "Booked"
              });
              
              customerData.totalBookingFreight += bookingFreight;
              customerData.totalLorryHire += correctedLorryHire; // Use corrected Lorry Hire
              customerData.totalAdvance += advance;
              if (!customerData.totalChallanDeduction) customerData.totalChallanDeduction = 0;
customerData.totalChallanDeduction += challanBiltyDeduction;
              customerData.totalHalting += haltingNet;
              customerData.totalDeduction += totalDeduction;
              customerData.totalMargin += margin;
              customerData.count += 1;
            });

            // =============================================
            // 3. CONVERT MAP TO ARRAY
            // =============================================
            const customerSummary = Array.from(customerMap.values())
              .filter(item => item.count > 0)
              .sort((a, b) => b.totalBookingFreight - a.totalBookingFreight);

            // =============================================
            // 4. GRAND TOTALS
            // =============================================
            const grandTotalBooking = customerSummary.reduce((sum, item) => sum + item.totalBookingFreight, 0);
            const grandTotalHire = customerSummary.reduce((sum, item) => sum + item.totalLorryHire, 0);
            const grandTotalAdvance = customerSummary.reduce((sum, item) => sum + item.totalAdvance, 0);
            const grandTotalHalting = customerSummary.reduce((sum, item) => sum + item.totalHalting, 0);
            const grandTotalDeduction = customerSummary.reduce((sum, item) => sum + item.totalDeduction, 0);
            const grandTotalMargin = grandTotalBooking - grandTotalHire;
            const grandMarginPercent = grandTotalBooking > 0 ? (grandTotalMargin / grandTotalBooking) * 100 : 0;

            // =============================================
            // 5. RENDER
            // =============================================
            let srNo = 0;

            if (customerSummary.length === 0) {
              return (
                <tr>
                  <td colSpan="14" style={{ textAlign: 'center', padding: '40px' }}>
                    <h3 style={{ color: '#666' }}>📭 No data found</h3>
                    <p style={{ color: '#999' }}>No bilties found with current filters.</p>
                  </td>
                </tr>
              );
            }

            return customerSummary.map((item) => {
              srNo++;
              const marginPercent = item.totalBookingFreight > 0 
                ? (item.totalMargin / item.totalBookingFreight) * 100 
                : 0;

              // Check if all balances are paid for this customer
              const allPaid = item.bilties.every(b => b.balancePaid === "✅ YES");

              return (
                <React.Fragment key={item.customer}>
                  {/* Customer Header Row */}
                  <tr style={{ background: allPaid ? '#e8f5e9' : '#fff8e1', fontWeight: 'bold' }}>
                    <td colSpan="5" style={{ fontSize: '14px', color: '#102a43' }}>
                      👤 {item.customer} ({item.count} Bilt{item.count > 1 ? 'ies' : 'y'})
                      {allPaid ? ' ✅ All Paid' : ''}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>₹{money(item.totalBookingFreight)}</td>
                    <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>₹{money(item.totalLorryHire)}</td>
                    <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>₹{money(item.totalAdvance)}</td>
                    <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>₹{money(item.totalLorryHire - item.totalAdvance)}</td>
                    <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>₹{money(item.totalHalting)}</td>
                    <td style={{ textAlign: 'center', fontSize: '13px' }}>
                      <span className={allPaid ? "statusActive" : "statusInactive"}>
                        {allPaid ? "✅ YES" : "⏳ PARTIAL"}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>₹{money(item.totalDeduction)}</td>
                    <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: item.totalMargin < 0 ? '#c62828' : '#16855b' }}>
                      ₹{money(item.totalMargin)}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: marginPercent < 0 ? '#c62828' : '#16855b' }}>
                      {marginPercent.toFixed(2)}%
                    </td>
                  </tr>

                  {/* Individual Bilty Rows */}
                  {item.bilties.map((biltyItem, index) => {
                    const biltyMarginPercent = biltyItem.bookingFreight > 0 
                      ? (biltyItem.margin / biltyItem.bookingFreight) * 100 
                      : 0;
                    
                    return (
                      <tr key={`${item.customer}-${index}`} style={{ fontSize: '12px' }}>
                        <td style={{ textAlign: 'center' }}>{srNo}.{index + 1}</td>
                        <td><strong>{biltyItem.bilty.bilty || "-"}</strong></td>
                        <td>{formatDate(biltyItem.bilty.date)}</td>
                        <td>{biltyItem.vehicleNo}</td>
                        <td>{biltyItem.bilty.consignor || "-"}</td>
                        <td style={{ textAlign: 'right' }}>₹{money(biltyItem.bookingFreight)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: biltyItem.correctedLorryHire !== biltyItem.lorryHire ? '#1769aa' : '#102a43' }}>
                          ₹{money(biltyItem.correctedLorryHire)}
                          {biltyItem.otherAddition > 0 && <span style={{ fontSize: '9px', color: '#1769aa' }}> *</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>₹{money(biltyItem.advance)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: biltyItem.balance < 0 ? '#c62828' : '#16855b' }}>
                          ₹{money(biltyItem.balance)}
                        </td>
                        <td style={{ textAlign: 'right', color: biltyItem.haltingNet !== 0 ? '#1769aa' : '#666' }}>
                          ₹{money(biltyItem.haltingNet)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={biltyItem.balancePaid === "✅ YES" ? "statusActive" : "statusInactive"}>
                            {biltyItem.balancePaid}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>₹{money(biltyItem.totalDeduction)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: biltyItem.margin < 0 ? '#c62828' : '#16855b' }}>
                          ₹{money(biltyItem.margin)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: biltyItem.margin < 0 ? '#c62828' : '#16855b' }}>
                          {biltyMarginPercent.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            });
          })()}
        </tbody>

        {/* =====================================================
            GRAND TOTAL FOOTER
        ===================================================== */}
        {(() => {
          const customerSummary = Array.from(
            new Map(
              bilties
                .filter((item) => {
                  if (reportFromDate && item.date < reportFromDate) return false;
                  if (reportToDate && item.date > reportToDate) return false;
                  return true;
                })
                .map((b) => [b.consignor, b])
            ).values()
          ).map((b) => ({
            customer: b.consignor || "Unknown",
            totalBookingFreight: bilties
              .filter((item) => item.consignor === b.consignor)
              .reduce((sum, item) => sum + Number(item.freight || 0), 0),
            totalLorryHire: bilties
              .filter((item) => item.consignor === b.consignor)
              .reduce((sum, item) => {
                const trip = trips.find((t) => String(t.biltyId) === String(item.id));
                if (!trip) return sum;
                const lorryHire = Number(trip.lorryFreight || 0);
                const haltingNet = Number(trip.haltingAddition || 0) - Number(trip.haltingDeduction || 0);
                const otherAddition = Number(trip.otherAddition || 0);
                return sum + lorryHire + haltingNet + otherAddition;
              }, 0),
            totalAdvance: bilties
              .filter((item) => item.consignor === b.consignor)
              .reduce((sum, item) => {
                const trip = trips.find((t) => String(t.biltyId) === String(item.id));
                return sum + Number(trip?.advance || 0);
              }, 0),
            totalHalting: bilties
              .filter((item) => item.consignor === b.consignor)
              .reduce((sum, item) => {
                const trip = trips.find((t) => String(t.biltyId) === String(item.id));
                if (!trip) return sum;
                return sum + Number(trip.haltingAddition || 0) - Number(trip.haltingDeduction || 0);
              }, 0),
            totalDeduction: bilties
              .filter((item) => item.consignor === b.consignor)
              .reduce((sum, item) => {
                const trip = trips.find((t) => String(t.biltyId) === String(item.id));
                if (!trip) return sum;
                return sum + Number(trip.damageDeduction || 0) + Number(trip.otherDeduction || 0) + Number(trip.haltingDeduction || 0);
              }, 0)
          }));

          const grandBooking = customerSummary.reduce((sum, item) => sum + item.totalBookingFreight, 0);
          const grandHire = customerSummary.reduce((sum, item) => sum + item.totalLorryHire, 0);
          const grandAdvance = customerSummary.reduce((sum, item) => sum + item.totalAdvance, 0);
          const grandHalting = customerSummary.reduce((sum, item) => sum + item.totalHalting, 0);
          const grandDeduction = customerSummary.reduce((sum, item) => sum + item.totalDeduction, 0);
          const grandMargin = grandBooking - grandHire;
          const grandPercent = grandBooking > 0 ? (grandMargin / grandBooking) * 100 : 0;

          if (grandBooking === 0) return null;

          return (
            <tfoot>
              <tr style={{ background: '#102a43', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                <td colSpan="5" style={{ textAlign: 'right', color: 'white' }}>
                  GRAND TOTAL ({customerSummary.length} Customers)
                </td>
                <td style={{ textAlign: 'right', color: 'white' }}>₹{money(grandBooking)}</td>
                <td style={{ textAlign: 'right', color: '#c8e6c9' }}>₹{money(grandHire)}</td>
                <td style={{ textAlign: 'right', color: 'white' }}>₹{money(grandAdvance)}</td>
                <td style={{ textAlign: 'right', color: '#c8e6c9' }}>₹{money(grandHire - grandAdvance)}</td>
                <td style={{ textAlign: 'right', color: '#c8e6c9' }}>₹{money(grandHalting)}</td>
                <td style={{ textAlign: 'center', color: 'white' }}>-</td>
                <td style={{ textAlign: 'right', color: '#c8e6c9' }}>₹{money(grandDeduction)}</td>
                <td style={{ textAlign: 'right', color: grandMargin < 0 ? '#ffcdd2' : '#c8e6c9', fontWeight: 'bold' }}>
                  ₹{money(grandMargin)}
                </td>
                <td style={{ textAlign: 'right', color: grandMargin < 0 ? '#ffcdd2' : '#c8e6c9', fontWeight: 'bold' }}>
                  {grandPercent.toFixed(2)}%
                </td>
              </tr>
            </tfoot>
          );
        })()}
      </table>
    </div>

    {/* =====================================================
        LEGEND
    ===================================================== */}
    {(() => {
      const hasData = bilties.some((item) => {
        if (reportFromDate && item.date < reportFromDate) return false;
        if (reportToDate && item.date > reportToDate) return false;
        return true;
      });
      
      if (!hasData) return null;
      
      return (
        <div style={{ 
          marginTop: '15px', 
          padding: '12px 16px', 
          background: '#f8fafc', 
          borderRadius: '8px',
          fontSize: '11px',
          color: '#666',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>📌 Legend:</span>
          </div>
          <div>
            <span style={{ color: '#16855b' }}>● Green</span>
            <span style={{ color: '#c62828', marginLeft: '12px' }}>● Red</span>
            <span style={{ color: '#1769aa', marginLeft: '12px' }}>● Adjusted</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>* Lorry Hire:</span>
            <span style={{ marginLeft: '5px' }}>Includes Halting + Other Addition (Commission)</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Balance Paid:</span>
            <span style={{ marginLeft: '5px' }}>✅ YES = Fully Paid | ⏳ NO = Pending</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Margin:</span>
            <span style={{ marginLeft: '5px' }}>Green = Profit | Red = Loss</span>
          </div>
        </div>
      );
    })()}
  </div>
)}

{/* TRIP REPORT - WITH BOOKING FREIGHT, HALTING, DAMAGE & MARGIN */}
{reportType === "TRIP" && (
  <div className="card">
    <div className="listHeader">
      <div>
        <h2>📦 Complete Trip Report</h2>
        <p>
          Total Trips: {filteredTrips.length} 
          {reportFromDate && reportToDate && ` | Period: ${formatDate(reportFromDate)} to ${formatDate(reportToDate)}`}
        </p>
      </div>
    </div>
    <div className="tableWrapper" style={{ overflowX: 'auto' }}>
      <table style={{ minWidth: '1200px', fontSize: '12px' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Trip No.</th>
            <th>Bilty No.</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Broker</th>
            <th>From</th>
            <th>To</th>
            <th style={{ textAlign: 'right' }}>Booking Freight (₹)</th>
            <th style={{ textAlign: 'right' }}>Lorry Hire (₹)</th>
            <th style={{ textAlign: 'right' }}>Halting (+/-)</th>
            <th style={{ textAlign: 'right' }}>Damage (+/-)</th>
            <th style={{ textAlign: 'right' }}>Other (+/-)</th>
            <th style={{ textAlign: 'right' }}>Final Hire (₹)</th>
            <th style={{ textAlign: 'right' }}>Advance (₹)</th>
            <th style={{ textAlign: 'right' }}>Balance (₹)</th>
            <th style={{ textAlign: 'right' }}>Challan Deduction (₹)</th>
            <th style={{ textAlign: 'right' }}>Margin (₹)</th>
            <th style={{ textAlign: 'right' }}>Margin %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrips.map((item) => {
            // =====================================================
            // 1. CALCULATE ALL VALUES
            // =====================================================
            
            // Base values
            const bookingFreight = Number(item.bookingFreight || 0);
            const lorryHire = Number(item.lorryFreight || 0);
            const advance = Number(item.advance || 0);
            // 🔥 Challan & Bilty Deduction (LHB se aata hai)
const challanBiltyDeduction = Number(item.challanBiltyDeduction || item.lhbOther || 0);
            
            // Additions
            const haltingAddition = Number(item.haltingAddition || 0);
            const haltingDeduction = Number(item.haltingDeduction || 0);
            const damageAddition = Number(item.damageAddition || 0);
            const damageDeduction = Number(item.damageDeduction || 0);
            const otherAddition = Number(item.otherAddition || 0);
            const otherDeduction = Number(item.otherDeduction || 0);
            
            // Halting = Addition - Deduction
            const haltingNet = haltingAddition - haltingDeduction;
            const damageNet = damageAddition - damageDeduction;
            const otherNet = otherAddition - otherDeduction;
            
            // Total Additions & Deductions
            const totalAdditions = haltingAddition + damageAddition + otherAddition;
            const totalDeductions = haltingDeduction + damageDeduction + otherDeduction;
            
            // Final Hire = Lorry Hire + Additions - Deductions
            const finalHire = lorryHire + totalAdditions - totalDeductions;
            
            // Balance = Final Hire - Advance
            const balance = finalHire - advance;
            
           // 🔥 Margin = Booking - Lorry Hire + Challan Deduction
const margin = bookingFreight - lorryHire + challanBiltyDeduction;
            
            // Margin % = (Margin / Booking Freight) * 100
            const marginPercent = bookingFreight > 0 ? (margin / bookingFreight) * 100 : 0;
            
            // Check if any adjustments exist
            const hasAdjustments = (haltingNet !== 0 || damageNet !== 0 || otherNet !== 0);
            
            return (
              <tr key={item.id} style={hasAdjustments ? { background: '#f0f8ff' } : {}}>
                <td>{formatDate(item.tripDate)}</td>
                <td><strong>{item.tripNo}</strong></td>
                <td>{item.biltyNo}</td>
                <td>{item.vehicleNo}</td>
                <td>{item.driverName}</td>
                <td>{item.brokerName || "-"}</td>
                <td>{item.from}</td>
                <td>{item.to}</td>
                
                {/* Booking Freight */}
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  ₹{money(bookingFreight)}
                </td>
                
                {/* Lorry Hire */}
                <td style={{ textAlign: 'right' }}>
                  ₹{money(lorryHire)}
                </td>
                
                {/* Halting */}
                <td style={{ 
                  textAlign: 'right', 
                  color: haltingNet > 0 ? '#16855b' : haltingNet < 0 ? '#c62828' : '#666' 
                }}>
                  {haltingNet !== 0 ? `₹${money(haltingNet)}` : '-'}
                </td>
                
                {/* Damage */}
                <td style={{ 
                  textAlign: 'right', 
                  color: damageNet > 0 ? '#16855b' : damageNet < 0 ? '#c62828' : '#666' 
                }}>
                  {damageNet !== 0 ? `₹${money(damageNet)}` : '-'}
                </td>
                
                {/* Other */}
                <td style={{ 
                  textAlign: 'right', 
                  color: otherNet > 0 ? '#16855b' : otherNet < 0 ? '#c62828' : '#666' 
                }}>
                  {otherNet !== 0 ? `₹${money(otherNet)}` : '-'}
                </td>
                
                {/* Final Hire */}
                <td style={{ 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  color: finalHire !== lorryHire ? '#1769aa' : '#102a43'
                }}>
                  ₹{money(finalHire)}
                  {finalHire !== lorryHire && <span style={{ fontSize: '10px', color: '#1769aa' }}> *</span>}
                </td>
                
                {/* Advance */}
                <td style={{ textAlign: 'right' }}>
                  ₹{money(advance)}
                </td>
                
                {/* Balance */}
                <td style={{ 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  color: balance < 0 ? '#c62828' : '#16855b'
                }}>
                  ₹{money(balance)}
                </td>

                {/* Challan & Bilty Deduction */}
<td style={{ 
  textAlign: 'right', 
  color: challanBiltyDeduction > 0 ? '#1769aa' : '#666',
  fontWeight: challanBiltyDeduction > 0 ? 'bold' : 'normal'
}}>
  {challanBiltyDeduction > 0 ? `₹${money(challanBiltyDeduction)}` : '-'}
</td>
                
                {/* Margin */}
                <td style={{ 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  color: margin < 0 ? '#c62828' : '#16855b'
                }}>
                  ₹{money(margin)}
                </td>
                
                {/* Margin % */}
                <td style={{ 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  color: marginPercent < 0 ? '#c62828' : marginPercent > 30 ? '#1769aa' : '#16855b'
                }}>
                  {marginPercent.toFixed(2)}%
                </td>
                
                {/* Status */}
                <td>
                  <span className={item.status === "DELIVERED" || item.status === "RECEIVED" ? "statusActive" : "statusInactive"}>
                    {item.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* =====================================================
            TRIP REPORT - TOTALS
        ===================================================== */}
        {filteredTrips.length > 0 && (() => {
          const totalBooking = filteredTrips.reduce((sum, item) => sum + Number(item.bookingFreight || 0), 0);
          const totalHire = filteredTrips.reduce((sum, item) => sum + Number(item.lorryFreight || 0), 0);
          const totalAdvance = filteredTrips.reduce((sum, item) => sum + Number(item.advance || 0), 0);
          const totalHalting = filteredTrips.reduce((sum, item) => sum + Number(item.haltingAddition || 0) - Number(item.haltingDeduction || 0), 0);
          const totalDamage = filteredTrips.reduce((sum, item) => sum + Number(item.damageAddition || 0) - Number(item.damageDeduction || 0), 0);
          const totalOther = filteredTrips.reduce((sum, item) => sum + Number(item.otherAddition || 0) - Number(item.otherDeduction || 0), 0);
          const totalFinalHire = filteredTrips.reduce((sum, item) => {
            const hire = Number(item.lorryFreight || 0);
            const add = Number(item.haltingAddition || 0) + Number(item.damageAddition || 0) + Number(item.otherAddition || 0);
            const ded = Number(item.haltingDeduction || 0) + Number(item.damageDeduction || 0) + Number(item.otherDeduction || 0);
            return sum + hire + add - ded;
          }, 0);
          const totalBalance = totalFinalHire - totalAdvance;
          // 🔥 Total Challan Deduction
const totalChallanDeduction = filteredTrips.reduce(
  (sum, item) => sum + Number(item.challanBiltyDeduction || item.lhbOther || 0), 
  0
);

// 🔥 Updated Margin
const totalMargin = totalBooking - totalHire + totalChallanDeduction;
const totalMarginPercent = totalBooking > 0 ? (totalMargin / totalBooking) * 100 : 0;
          return (
            <tfoot>
              <tr style={{ background: '#102a43', color: 'white', fontWeight: 'bold' }}>
                <td colSpan="8" style={{ textAlign: 'right', color: 'white' }}>
                  GRAND TOTAL ({filteredTrips.length} Trips)
                </td>
                <td style={{ textAlign: 'right', color: 'white' }}>₹{money(totalBooking)}</td>
                <td style={{ textAlign: 'right', color: 'white' }}>₹{money(totalHire)}</td>
                <td style={{ textAlign: 'right', color: totalHalting !== 0 ? '#ffcdd2' : 'white' }}>
                  {totalHalting !== 0 ? `₹${money(totalHalting)}` : '-'}
                </td>
                <td style={{ textAlign: 'right', color: totalDamage !== 0 ? '#ffcdd2' : 'white' }}>
                  {totalDamage !== 0 ? `₹${money(totalDamage)}` : '-'}
                </td>
                <td style={{ textAlign: 'right', color: totalOther !== 0 ? '#ffcdd2' : 'white' }}>
                  {totalOther !== 0 ? `₹${money(totalOther)}` : '-'}
                </td>
                <td style={{ textAlign: 'right', color: '#c8e6c9' }}>₹{money(totalFinalHire)}</td>
                <td style={{ textAlign: 'right', color: 'white' }}>₹{money(totalAdvance)}</td>
                <td style={{ textAlign: 'right', color: '#ffcdd2', fontWeight: 'bold' }}>
                  ₹{money(totalBalance)}
                </td>
                <td style={{ textAlign: 'right', color: '#c8e6c9' }}>
  ₹{money(totalChallanDeduction)}
</td>
                <td style={{ textAlign: 'right', color: totalMargin < 0 ? '#ffcdd2' : '#c8e6c9', fontWeight: 'bold' }}>
                  ₹{money(totalMargin)}
                </td>
                <td style={{ textAlign: 'right', color: totalMarginPercent < 0 ? '#ffcdd2' : '#c8e6c9', fontWeight: 'bold' }}>
                  {totalMarginPercent.toFixed(2)}%
                </td>
                <td></td>
              </tr>
            </tfoot>
          );
        })()}
      </table>
      {filteredTrips.length === 0 && (
        <div className="empty">No Trip found with current filters.</div>
      )}
    </div>
    
    {/* =====================================================
        LEGEND
    ===================================================== */}
    {filteredTrips.length > 0 && (
      <div style={{ 
        marginTop: '15px', 
        padding: '12px 16px', 
        background: '#f8fafc', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        border: '1px solid #e5e7eb'
      }}>
        <div>
          <span style={{ fontWeight: 'bold' }}>📌 Legend:</span>
        </div>
        <div>
          <span style={{ color: '#16855b' }}>● Positive</span>
          <span style={{ color: '#c62828', marginLeft: '12px' }}>● Negative</span>
          <span style={{ color: '#1769aa', marginLeft: '12px' }}>● Adjusted</span>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Halting/Damage/Other:</span>
          <span style={{ marginLeft: '5px' }}>(+) Addition & (-) Deduction</span>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Margin %:</span>
          <span style={{ marginLeft: '5px' }}>Green = Profit | Red = Loss</span>
        </div>
      </div>
    )}
  </div>
)}

        {/* BILL REPORT */}
        {reportType === "BILL" && (
          <div className="card">
            <div className="listHeader">
              <div>
                <h2>🧾 Bill Report</h2>
                <p>Bill related account entries</p>
              </div>
            </div>
            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Bill No.</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>TDS</th>
                    <th>Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((item) => {
                    const tds = Object.values(item.billTds || {}).reduce((sum, value) => sum + Number(value || 0), 0);
                    const deduction = Object.values(item.billDeductions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
                    return (
                      <tr key={item.id}>
                        <td>{formatDate(item.date)}</td>
                        <td>{item.partyName}</td>
                        <td>{item.billNo || "-"}</td>
                        <td>{item.referenceNo || "-"}</td>
                        <td>₹{money(item.amount)}</td>
                        <td>₹{money(tds)}</td>
                        <td>₹{money(deduction)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };
    // =========================================================
  // CONSIGNMENT TRACKING
  // =========================================================

  const [trackingSearch, setTrackingSearch] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

    const searchConsignment = (searchTerm) => {
  console.log("🔍 SEARCH STARTED:", searchTerm);
  
  if (!searchTerm.trim()) {
    alert("Please enter Bilty Number or Trip Number.");
    return;
  }

  setTrackingLoading(true);

  const term = String(searchTerm).trim().toUpperCase();
  console.log("🔍 Search Term:", term);

  try {
    // 1. Bilty Search
    const bilty = bilties.find(
      (item) => String(item.bilty || "").trim().toUpperCase() === term
    );
    console.log("📦 Bilty Found:", bilty);

    // 2. Trip Search
    const trip = trips.find(
      (item) => String(item.tripNo || "").trim().toUpperCase() === term ||
                String(item.biltyNo || "").trim().toUpperCase() === term
    );
    console.log("🚛 Trip Found:", trip);

    if (!bilty && !trip) {
      setTrackingResult(null);
      setTrackingLoading(false);
      alert("❌ Bilty / Trip Number not found!");
      return;
    }

    // Final Bilty
    const finalBilty = bilty || (trip ? bilties.find((item) => String(item.id) === String(trip.biltyId)) : null);
    console.log("📦 Final Bilty:", finalBilty);

    // Find POD
    const pod = pods.find(
      (item) => String(item.biltyNo || "").trim().toUpperCase() === String(finalBilty?.bilty || trip?.biltyNo || "").trim().toUpperCase()
    );
    console.log("📋 POD Found:", pod);

    // Find Bill
    const bill = bills.find(
      (item) => String(item.biltyNo || "").trim().toUpperCase() === String(finalBilty?.bilty || trip?.biltyNo || "").trim().toUpperCase()
    );
    console.log("🧾 Bill Found:", bill);

    // Total Received from Accounts
    const received = accounts
      .filter((acc) => {
        const partyName = String(acc.partyName || "").toUpperCase();
        const consignor = String(finalBilty?.consignor || "").toUpperCase();
        const consignee = String(finalBilty?.consignee || "").toUpperCase();
        const broker = String(trip?.brokerName || "").toUpperCase();
        return partyName === consignor || partyName === consignee || partyName === broker;
      })
      .reduce((sum, acc) => sum + Number(acc.amount || 0), 0);
    console.log("💰 Received:", received);

    const freight = Number(finalBilty?.freight || 0);
    const pending = freight - received;

    // Trip Details
    const tripHire = Number(trip?.lorryFreight || 0);
    const tripAdvance = Number(trip?.advance || 0);
    const tripHalting = Number(trip?.haltingAddition || 0) + Number(trip?.haltingDeduction || 0);
    const tripDamage = Number(trip?.damageAddition || 0) + Number(trip?.damageDeduction || 0);
    const tripBalance = (tripHire + tripHalting - tripDamage) - tripAdvance;
    const tripPaid = Number(trip?.lhbCash || 0) + Number(trip?.lhbBank || 0) + Number(trip?.lhbOther || 0);
    const tripPending = tripBalance - tripPaid;

    setTrackingResult({
      bilty: finalBilty || null,
      trip: trip || null,
      pod: pod || null,
      bill: bill || null,
      received: received,
      pending: pending,
      halting: tripHalting,
      ewayBillNo: finalBilty?.ewayBillNo || "",
      ewayBillExpiry: finalBilty?.ewayBillExpiry || "",
      materialValue: finalBilty?.materialValue || 0,
      tripHire: tripHire,
      tripAdvance: tripAdvance,
      tripDamage: tripDamage,
      tripBalance: tripBalance,
      tripPaid: tripPaid,
      tripPending: tripPending,
      ownerName: trip?.ownerName || finalBilty?.ownerName || "",
      vehicleNo: trip?.vehicleNo || finalBilty?.vehicle || ""
    });

    console.log("✅ Tracking Result Set:", trackingResult);
    setTrackingLoading(false);

  } catch (e) {
    console.error("❌ SEARCH ERROR:", e);
    setTrackingResult(null);
    setTrackingLoading(false);
    alert("❌ Error searching: " + e.message);
  }
};
    const renderTrackingPage = () => {
  return (
    <>
      <div className="pageTitle" style={{
        background: 'linear-gradient(135deg, #102a43 0%, #1a3a5c 100%)',
        padding: '25px 30px',
        borderRadius: '10px',
        color: 'white',
        marginBottom: '25px'
      }}>
        <div>
          <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>📦 Consignment Tracking</h2>
          <p style={{ color: '#b8d4e8', margin: '5px 0 0', fontSize: '13px' }}>
            Bilty Number se pura record dekhein (Professional View)
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={trackingSearch}
            onChange={(e) => setTrackingSearch(e.target.value)}
            placeholder="🔍 Bilty No. ya Trip No. dalo (e.g., DHR-2026-00001)"
            style={{
              flex: 1,
              padding: '14px 16px',
              fontSize: '16px',
              border: '2px solid #dfe6ed',
              borderRadius: '8px',
              outline: 'none'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchConsignment(trackingSearch);
              }
            }}
          />
          <button
            className="blueBtn"
            onClick={() => searchConsignment(trackingSearch)}
            style={{
              padding: '14px 30px',
              fontSize: '16px',
              borderRadius: '8px',
              fontWeight: '700'
            }}
          >
            🚀 TRACK
          </button>
        </div>
      </div>

      {trackingLoading && <p className="empty">Searching...</p>}

      {!trackingLoading && !trackingResult && (
        <div className="empty" style={{ padding: '50px', textAlign: 'center', background: 'white', borderRadius: '10px' }}>
          <h3>Bilty Number dal kar Track karein</h3>
          <p style={{ color: '#666' }}>Poora record, Freight, Trip, POD sab yahan dikhega.</p>
        </div>
      )}

      {!trackingLoading && trackingResult && (
        <div className="trackingDetails">
          {/* Card 1: Bilty Details */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#102a43' }}>🧾 Bilty Details</h3>
              <span className="statusActive" style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                {trackingResult.bilty?.status || 'N/A'}
              </span>
            </div>

            <div className="formGrid" style={{ marginBottom: '0' }}>
              <div className="field">
                <label style={{ color: '#888', fontSize: '12px' }}>Bilty No.</label>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.bilty?.bilty || 'Not Found'}</div>
              </div>
              <div className="field">
                <label style={{ color: '#888', fontSize: '12px' }}>Date</label>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{formatDate(trackingResult.bilty?.date)}</div>
              </div>
              <div className="field">
                <label style={{ color: '#888', fontSize: '12px' }}>From</label>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.bilty?.pickup || '-'}</div>
              </div>
              <div className="field">
                <label style={{ color: '#888', fontSize: '12px' }}>To</label>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.bilty?.delivery || '-'}</div>
              </div>
              <div className="field">
                <label style={{ color: '#888', fontSize: '12px' }}>Material</label>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.bilty?.material || '-'}</div>
              </div>
              <div className="field">
                <label style={{ color: '#888', fontSize: '12px' }}>Freight</label>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>₹{money(trackingResult.bilty?.freight)}</div>
              </div>
            </div>
          </div>

          {/* Card 2: Freight & Bill */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#102a43' }}>💰 Freight & Bill</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Freight</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#102a43' }}>₹{money(trackingResult.bilty?.freight)}</div>
              </div>
              <div style={{ background: '#f0fff4', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Received</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#16855b' }}>₹{money(trackingResult.received)}</div>
              </div>
              <div style={{ background: '#fff0f0', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#c62828' }}>₹{money(trackingResult.pending)}</div>
              </div>
            </div>
          </div>

          {/* Card 3: Trip & Vehicle */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#102a43' }}>🚛 Trip & Vehicle Details</h3>
            </div>
            {trackingResult.trip ? (
              <div className="formGrid">
                <div className="field">
                  <label style={{ color: '#888', fontSize: '12px' }}>Trip No.</label>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.trip.tripNo}</div>
                </div>
                <div className="field">
                  <label style={{ color: '#888', fontSize: '12px' }}>Vehicle No.</label>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.trip.vehicleNo}</div>
                </div>
                <div className="field">
                  <label style={{ color: '#888', fontSize: '12px' }}>Driver</label>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.trip.driverName}</div>
                </div>
                <div className="field">
                  <label style={{ color: '#888', fontSize: '12px' }}>Status</label>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.trip.status}</div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#888' }}>Is bilty ke liye abhi koi Trip assign nahi hui hai.</p>
            )}
          </div>

          {/* Card 4: POD */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#102a43' }}>📋 POD / Delivery Status</h3>
            </div>
            {trackingResult.pod ? (
              <div className="formGrid">
                <div className="field">
                  <label style={{ color: '#888', fontSize: '12px' }}>POD No.</label>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.pod.podNo}</div>
                </div>
                <div className="field">
                  <label style={{ color: '#888', fontSize: '12px' }}>Delivery Date</label>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{formatDate(trackingResult.pod.deliveryDate)}</div>
                </div>
                <div className="field">
                  <label style={{ color: '#888', fontSize: '12px' }}>Received By</label>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.pod.receivedBy}</div>
                </div>
                <div className="field">
                  <label style={{ color: '#888', fontSize: '12px' }}>Status</label>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{trackingResult.pod.status}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', background: '#f0f8ff', borderRadius: '8px' }}>
                <strong style={{ color: '#1769aa' }}>📭 POD abhi scan nahi hui hai. Delivery pending hai.</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

  // =========================================================
  // CUSTOMER VISITS FUNCTIONS
  // =========================================================

  const newVisit = () => {
    setEditingVisit(null);
    setVisitForm({
      id: null,
      visit_date: new Date().toISOString().slice(0, 10),
      customer_type: "NEW CUSTOMER",
      company_name: "",
      mobile: "",
      email: "",
      address: "",
      remarks: "",
      persons: [{ name: "", designation: "", mobile: "", email: "" }]
    });
    setPage("customerVisits");
    goTop();
  };

  const editVisit = (item) => {
    setVisitForm({
      id: item.id,
      visit_date: item.visit_date || new Date().toISOString().slice(0, 10),
      customer_type: item.customer_type || "NEW CUSTOMER",
      company_name: item.company_name || "",
      mobile: item.mobile || "",
      email: item.email || "",
      address: item.address || "",
      remarks: item.remarks || "",
      persons: Array.isArray(item.persons) && item.persons.length > 0
        ? item.persons
        : [{ name: "", designation: "", mobile: "", email: "" }]
    });
    setEditingVisit(item);
    setPage("customerVisits");
    goTop();
  };

  const updateVisitForm = (field, value) => {
    setVisitForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePersonField = (index, field, value) => {
    setVisitForm((prev) => {
      const updated = [...prev.persons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, persons: updated };
    });
  };

  const addPersonField = () => {
    setVisitForm((prev) => ({
      ...prev,
      persons: [...prev.persons, { name: "", designation: "", mobile: "", email: "" }]
    }));
  };

  const removePersonField = (index) => {
    if (visitForm.persons.length <= 1) {
      alert("At least one person required.");
      return;
    }
    setVisitForm((prev) => ({
      ...prev,
      persons: prev.persons.filter((_, i) => i !== index)
    }));
  };

  const saveVisit = async () => {
    if (!visitForm.company_name.trim()) {
      alert("Company / Customer Name enter karein.");
      return;
    }
    if (!visitForm.mobile.trim()) {
      alert("Mobile Number enter karein.");
      return;
    }
    if (!/^[0-9]{10}$/.test(visitForm.mobile)) {
      alert("Mobile Number 10 digits ka hona chahiye.");
      return;
    }

    // Filter empty persons
    const cleanPersons = visitForm.persons.filter(
      (p) => p.name.trim() !== "" || p.mobile.trim() !== ""
    );

    const finalData = {
      visit_date: visitForm.visit_date || new Date().toISOString().slice(0, 10),
      customer_type: visitForm.customer_type || "NEW CUSTOMER",
      company_name: visitForm.company_name.trim(),
      mobile: visitForm.mobile.trim(),
      email: visitForm.email.trim(),
      address: visitForm.address.trim(),
      remarks: visitForm.remarks.trim(),
      persons: cleanPersons,
    };

    try {
      let result;
      if (editingVisit && editingVisit.id) {
        result = await supabase
          .from('customer_visits')
          .update(finalData)
          .eq('id', editingVisit.id);
      } else {
        result = await supabase
          .from('customer_visits')
          .insert([finalData]);
      }

      if (result.error) throw result.error;

      alert(`✅ Customer Visit ${editingVisit ? "updated" : "saved"} successfully!`);
      setVisitForm({
        id: null,
        visit_date: new Date().toISOString().slice(0, 10),
        customer_type: "NEW CUSTOMER",
        company_name: "",
        mobile: "",
        email: "",
        address: "",
        remarks: "",
        persons: [{ name: "", designation: "", mobile: "", email: "" }]
      });
      setEditingVisit(null);
      await loadAllData();
    } catch (e) {
      console.error("❌ ERROR:", e);
      alert("❌ Error: " + e.message);
    }
  };

  const deleteVisit = async (id) => {
    if (!window.confirm("Kya aap is Customer Visit ko delete karna chahte hain?")) return;
    try {
      const { error } = await supabase.from('customer_visits').delete().eq('id', id);
      if (error) throw error;
      await loadAllData();
      alert("✅ Deleted successfully!");
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
  };

  const exportVisitsExcel = () => {
    const filtered = getFilteredVisits();

    if (filtered.length === 0) {
      alert("❌ No data to export.");
      return;
    }

    const exportData = [];
    filtered.forEach((visit) => {
      if (visit.persons && visit.persons.length > 0) {
        visit.persons.forEach((person, idx) => {
          exportData.push({
            "Visit Date": visit.visit_date,
            "Customer Type": visit.customer_type,
            "Company Name": visit.company_name,
            "Company Mobile": visit.mobile,
            "Company Email": visit.email,
            "Address": visit.address,
            "Person #": idx + 1,
            "Person Name": person.name || "",
            "Designation": person.designation || "",
            "Person Mobile": person.mobile || "",
            "Person Email": person.email || "",
            "Remarks": visit.remarks || "",
          });
        });
      } else {
        exportData.push({
          "Visit Date": visit.visit_date,
          "Customer Type": visit.customer_type,
          "Company Name": visit.company_name,
          "Company Mobile": visit.mobile,
          "Company Email": visit.email,
          "Address": visit.address,
          "Person #": "-",
          "Person Name": "-",
          "Designation": "-",
          "Person Mobile": "-",
          "Person Email": "-",
          "Remarks": visit.remarks || "",
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 25 },
      { wch: 40 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 30 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customer Visits");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Customer_Visits_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`✅ ${exportData.length} records exported!`);
  };

  const getFilteredVisits = () => {
    return customerVisits.filter((item) => {
      // Type filter
      if (visitTypeFilter !== "ALL" && item.customer_type !== visitTypeFilter) return false;

      // Date filter
      const date = String(item.visit_date || "").slice(0, 10);
      if (visitFromDate && date < visitFromDate) return false;
      if (visitToDate && date > visitToDate) return false;

      // Period filter
      if (visitReportPeriod === "MONTH" && visitFromDate) {
        if (date.slice(0, 7) !== visitFromDate.slice(0, 7)) return false;
      }
      if (visitReportPeriod === "YEAR" && visitFromDate) {
        if (date.slice(0, 4) !== visitFromDate.slice(0, 4)) return false;
      }

      // Search filter
      if (visitSearch.trim()) {
        const term = visitSearch.toLowerCase();
        const searchText = `
          ${item.company_name || ""}
          ${item.mobile || ""}
          ${item.email || ""}
          ${item.address || ""}
          ${item.remarks || ""}
          ${(item.persons || []).map(p => `${p.name} ${p.designation} ${p.mobile} ${p.email}`).join(" ")}
        `.toLowerCase();
        if (!searchText.includes(term)) return false;
      }

      return true;
    });
  };

  const printVisits = () => {
    const filtered = getFilteredVisits();
    if (filtered.length === 0) {
      alert("❌ No data to print.");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      alert("Popup blocked! Please allow popups.");
      return;
    }

    let rows = "";
    filtered.forEach((visit) => {
      const persons = visit.persons || [];
      if (persons.length > 0) {
        persons.forEach((p, i) => {
          rows += `
            <tr>
              ${i === 0 ? `<td rowspan="${persons.length}">${formatDate(visit.visit_date)}</td>` : ""}
              ${i === 0 ? `<td rowspan="${persons.length}"><span class="badge">${visit.customer_type}</span></td>` : ""}
              ${i === 0 ? `<td rowspan="${persons.length}">${visit.company_name}</td>` : ""}
              ${i === 0 ? `<td rowspan="${persons.length}">${visit.mobile}</td>` : ""}
              <td>${p.name || "-"}</td>
              <td>${p.designation || "-"}</td>
              <td>${p.mobile || "-"}</td>
              <td>${p.email || "-"}</td>
            </tr>
          `;
        });
      } else {
        rows += `
          <tr>
            <td>${formatDate(visit.visit_date)}</td>
            <td><span class="badge">${visit.customer_type}</span></td>
            <td>${visit.company_name}</td>
            <td>${visit.mobile}</td>
            <td>-</td><td>-</td><td>-</td><td>-</td>
          </tr>
        `;
      }
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Visits Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .company { text-align: center; font-size: 22px; font-weight: bold; }
            .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
            th { background: #102a43; color: white; }
            .badge { background: #1769aa; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
            tfoot { background: #f0f0f0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="company">${COMPANY.name}</div>
          <div class="subtitle">Customer Visits Report</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Company</th>
                <th>Company Mobile</th>
                <th>Person Name</th>
                <th>Designation</th>
                <th>Person Mobile</th>
                <th>Person Email</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr>
                <td colspan="8">TOTAL VISITS: ${filtered.length}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // =========================================================
  // CUSTOMER VISITS PAGE
  // =========================================================

  const renderCustomerVisitsPage = () => {
    const filtered = getFilteredVisits();

    return (
      <>
        <div className="pageTitle" style={{
          background: 'linear-gradient(135deg, #102a43 0%, #1a3a5c 100%)',
          padding: '25px 30px',
          borderRadius: '10px',
          color: 'white',
          marginBottom: '25px'
        }}>
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>📋 Customer Visit Entry</h2>
            <p style={{ color: '#b8d4e8', margin: '5px 0 0', fontSize: '13px' }}>
              Daily Customer Visit Records — New / Existing / Pipeline
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="card">
          <h3>{editingVisit ? "Edit Customer Visit" : "New Customer Visit"}</h3>

          <div className="sectionTitle">VISIT DETAILS</div>
          <div className="formGrid">
            <div className="field">
              <label>Visit Date *</label>
              <input
                type="date"
                value={visitForm.visit_date}
                onChange={(e) => updateVisitForm("visit_date", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Customer Type *</label>
              <select
                value={visitForm.customer_type}
                onChange={(e) => updateVisitForm("customer_type", e.target.value)}
              >
                <option value="NEW CUSTOMER">🆕 NEW CUSTOMER</option>
                <option value="EXISTING CUSTOMER">🔄 EXISTING CUSTOMER</option>
                <option value="PIPLINE CUSTOMER">📊 PIPELINE CUSTOMER</option>
                <option value="OTHER">📌 OTHER</option>
              </select>
            </div>
          </div>

          <div className="sectionTitle">COMPANY / CUSTOMER DETAILS</div>
          <div className="formGrid">
            <div className="field full">
              <label>Company / Customer Name *</label>
              <input
                value={visitForm.company_name}
                onChange={(e) => updateVisitForm("company_name", e.target.value)}
                placeholder="ABC Industries Pvt. Ltd."
              />
            </div>

            <div className="field">
              <label>Mobile Number *</label>
              <input
                value={visitForm.mobile}
                onChange={(e) => updateVisitForm("mobile", e.target.value)}
                placeholder="9876543210"
                maxLength={10}
              />
            </div>

            <div className="field">
              <label>Email ID</label>
              <input
                type="email"
                value={visitForm.email}
                onChange={(e) => updateVisitForm("email", e.target.value)}
                placeholder="company@email.com"
              />
            </div>

            <div className="field full">
              <label>Address</label>
              <textarea
                value={visitForm.address}
                onChange={(e) => updateVisitForm("address", e.target.value)}
                placeholder="Full address"
              />
            </div>

            <div className="field full">
              <label>Remarks</label>
              <textarea
                value={visitForm.remarks}
                onChange={(e) => updateVisitForm("remarks", e.target.value)}
                placeholder="Visit purpose, notes..."
              />
            </div>
          </div>

          {/* PERSONS */}
          <div className="sectionTitle">👥 PERSONS CONTACTED</div>

          {visitForm.persons.map((person, idx) => (
            <div key={idx} style={{
              border: '1px solid #dfe6ed',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: '#102a43' }}>Person #{idx + 1}</strong>
                {visitForm.persons.length > 1 && (
                  <button
                    className="deleteBtn"
                    onClick={() => removePersonField(idx)}
                    style={{ padding: '3px 10px', fontSize: '11px' }}
                  >
                    ✕ REMOVE
                  </button>
                )}
              </div>
              <div className="formGrid">
                <div className="field">
                  <label>Person Name</label>
                  <input
                    value={person.name || ""}
                    onChange={(e) => updatePersonField(idx, "name", e.target.value)}
                    placeholder="Full Name"
                  />
                </div>
                <div className="field">
                  <label>Designation</label>
                  <input
                    value={person.designation || ""}
                    onChange={(e) => updatePersonField(idx, "designation", e.target.value)}
                    placeholder="Manager / Owner"
                  />
                </div>
                <div className="field">
                  <label>Mobile Number</label>
                  <input
                    value={person.mobile || ""}
                    onChange={(e) => updatePersonField(idx, "mobile", e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
                <div className="field">
                  <label>Email ID</label>
                  <input
                    value={person.email || ""}
                    onChange={(e) => updatePersonField(idx, "email", e.target.value)}
                    placeholder="person@email.com"
                  />
                </div>
              </div>
            </div>
          ))}

          <button className="blueBtn" onClick={addPersonField} style={{ marginTop: '8px' }}>
            + ADD ANOTHER PERSON
          </button>

          <div className="formButtons" style={{ marginTop: '20px' }}>
            {editingVisit && (
              <button
                className="grayBtn"
                onClick={() => {
                  setEditingVisit(null);
                  setVisitForm({
                    id: null,
                    visit_date: new Date().toISOString().slice(0, 10),
                    customer_type: "NEW CUSTOMER",
                    company_name: "",
                    mobile: "",
                    email: "",
                    address: "",
                    remarks: "",
                    persons: [{ name: "", designation: "", mobile: "", email: "" }]
                  });
                }}
              >
                CANCEL
              </button>
            )}
            <button className="greenBtn" onClick={saveVisit}>
              {editingVisit ? "UPDATE VISIT" : "SAVE VISIT"}
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="card">
          <div className="sectionTitle">🔍 FILTERS & REPORT</div>
          <div className="formGrid">
            <div className="field">
              <label>Report Period</label>
              <select value={visitReportPeriod} onChange={(e) => setVisitReportPeriod(e.target.value)}>
                <option value="DAY">Day Wise</option>
                <option value="MONTH">Month Wise</option>
                <option value="YEAR">Year Wise</option>
                <option value="CUSTOM">Custom Date</option>
              </select>
            </div>
            <div className="field">
              <label>From Date</label>
              <input type="date" value={visitFromDate} onChange={(e) => setVisitFromDate(e.target.value)} />
            </div>
            <div className="field">
              <label>To Date</label>
              <input type="date" value={visitToDate} onChange={(e) => setVisitToDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Customer Type</label>
              <select value={visitTypeFilter} onChange={(e) => setVisitTypeFilter(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="NEW CUSTOMER">New Customer</option>
                <option value="EXISTING CUSTOMER">Existing Customer</option>
                <option value="PIPLINE CUSTOMER">Pipeline Customer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="field full">
              <label>Search</label>
              <input
                value={visitSearch}
                onChange={(e) => setVisitSearch(e.target.value)}
                placeholder="Search by company, mobile, person name..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '15px', flexWrap: 'wrap' }}>
            <button
              className="grayBtn"
              onClick={() => {
                setVisitSearch("");
                setVisitTypeFilter("ALL");
                setVisitFromDate("");
                setVisitToDate("");
                setVisitReportPeriod("DAY");
              }}
            >
              🔄 RESET
            </button>
            <button className="greenBtn" onClick={exportVisitsExcel}>
              📊 EXPORT EXCEL
            </button>
            <button className="printBtn" onClick={printVisits} style={{ background: '#1769aa' }}>
              🖨️ PRINT REPORT
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="card">
          <div className="listHeader">
            <div>
              <h2>Customer Visits List</h2>
              <p>Showing: {filtered.length} of {customerVisits.length}</p>
            </div>
          </div>

          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Company</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Persons</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.visit_date)}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background:
                          item.customer_type === "NEW CUSTOMER" ? "#e8f5e9" :
                          item.customer_type === "EXISTING CUSTOMER" ? "#e3f2fd" :
                          item.customer_type === "PIPLINE CUSTOMER" ? "#fff3e0" : "#f3f4f6",
                        color:
                          item.customer_type === "NEW CUSTOMER" ? "#16855b" :
                          item.customer_type === "EXISTING CUSTOMER" ? "#1769aa" :
                          item.customer_type === "PIPLINE CUSTOMER" ? "#ed6c02" : "#666"
                      }}>
                        {item.customer_type}
                      </span>
                    </td>
                    <td><strong>{item.company_name}</strong></td>
                    <td>{item.mobile}</td>
                    <td>{item.email || "-"}</td>
                    <td>
                      {(item.persons || []).map((p, i) => (
                        <div key={i} style={{ fontSize: '11px' }}>
                          • {p.name || "-"} {p.designation ? `(${p.designation})` : ""}
                        </div>
                      ))}
                    </td>
                    <td>
                      <button className="editBtn" onClick={() => editVisit(item)}>EDIT</button>
                      <button className="deleteBtn" onClick={() => deleteVisit(item.id)}>DELETE</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="empty">No customer visits found.</div>
            )}
          </div>
        </div>
      </>
    );
  };

// =========================================================
// DAILY TRACKING PAGE - WITH DRIVER NUMBER & LOCATION
// =========================================================

const renderDailyTrackingPage = () => {
  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  // 🔥 SIRF UN VEHICLES KO SHOW KARO JINKE TRIPS HAIN
  const activeVehicles = vehicles.filter((v) => {
    const hasTrip = trips.some((t) => String(t.vehicleId) === String(v.id));
    return hasTrip;
  });

  // 🔥 VEHICLE KA LATEST STATUS FETCH KARO
  const getVehicleStatus = (vehicleId) => {
    const vehicleTrips = trips.filter((t) => String(t.vehicleId) === String(vehicleId));
    if (vehicleTrips.length === 0) return { status: "NOT DISPATCHED", color: "#6b7280", bg: "#f3f4f6" };
    
    const latestTrip = vehicleTrips.sort((a, b) => 
      new Date(b.tripDate) - new Date(a.tripDate)
    )[0];
    
    const statusMap = {
      "DISPATCHED": { status: "🚀 Dispatched", color: "#1769aa", bg: "#e3f2fd" },
      "IN TRANSIT": { status: "🚛 In Transit", color: "#ed6c02", bg: "#fff3e0" },
      "RECEIVED": { status: "📦 Received", color: "#16855b", bg: "#e8f5e9" },
      "DELIVERED": { status: "✅ Delivered", color: "#16855b", bg: "#e8f5e9" },
      "CANCELLED": { status: "❌ Cancelled", color: "#c62828", bg: "#ffebee" },
    };
    
    return statusMap[latestTrip.status] || { status: latestTrip.status || "UNKNOWN", color: "#6b7280", bg: "#f3f4f6" };
  };

  // 🔥 HAR VEHICLE KA LATEST TRIP
  const getLatestTrip = (vehicleId) => {
    const vehicleTrips = trips.filter((t) => String(t.vehicleId) === String(vehicleId));
    if (vehicleTrips.length === 0) return null;
    return vehicleTrips.sort((a, b) => new Date(b.tripDate) - new Date(a.tripDate))[0];
  };

  const getTripCount = (vehicleId) => {
    return trips.filter((t) => String(t.vehicleId) === String(vehicleId)).length;
  };

  // 🔥 IN TRANSIT VEHICLES FILTER (SIRF IN TRANSIT / DISPATCHED)
  const inTransitVehicles = activeVehicles.filter((v) => {
    const status = getVehicleStatus(v.id);
    return status.status.includes("Transit") || status.status.includes("Dispatched");
  });

  // =====================================================
  // FILTER VEHICLES
  // =====================================================

  const filteredVehicles = inTransitVehicles.filter((v) => {
    if (!dailyTrackingSearch.trim()) return true;
    const search = dailyTrackingSearch.toLowerCase().trim();
    return (
      v.vehicleNo?.toLowerCase().includes(search) ||
      v.driverName?.toLowerCase().includes(search) ||
      v.driverMobile?.toLowerCase().includes(search) ||
      v.ownerName?.toLowerCase().includes(search) ||
      v.vehicleType?.toLowerCase().includes(search)
    );
  });

  // =====================================================
  // UPDATE LOCATION FUNCTION
  // =====================================================

  const handleUpdateLocation = async (vehicleId, currentLocation) => {
    try {
      const latestTrip = getLatestTrip(vehicleId);
      if (!latestTrip) {
        alert("❌ No trip found for this vehicle.");
        return;
      }

      const { error } = await supabase
        .from('trips')
        .update({ 
          currentLocation: currentLocation,
          lastUpdated: new Date().toISOString()
        })
        .eq('id', latestTrip.id);

      if (error) throw error;
      
      alert(`✅ Location updated to "${currentLocation}" successfully!`);
      await loadAllData();
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
  };

  // =====================================================
  // UPDATE STATUS FUNCTION
  // =====================================================

  const handleStatusUpdate = async (vehicleId, newStatus) => {
    try {
      const latestTrip = getLatestTrip(vehicleId);
      if (!latestTrip) {
        alert("❌ No trip found for this vehicle.");
        return;
      }

      const { error } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', latestTrip.id);

      if (error) throw error;
      
      alert(`✅ Status updated to ${newStatus} successfully!`);
      await loadAllData();
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalVehicles = activeVehicles.length;
  const inTransit = inTransitVehicles.length;
  const delivered = activeVehicles.filter(v => getVehicleStatus(v.id).status.includes("Delivered") || getVehicleStatus(v.id).status.includes("Received")).length;
  const pending = totalVehicles - delivered;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* PAGE HEADER */}
      <div className="pageTitle" style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #2d6a9f 100%)',
        padding: '30px 35px',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '30px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            🚚 Live Fleet Tracking
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0 0', fontSize: '14px', fontWeight: '300' }}>
            Real-time vehicle monitoring & location tracking
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: '-20px',
          top: '-20px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          right: '60px',
          bottom: '-40px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          zIndex: 1
        }} />
      </div>

      {/* STATISTICS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '25px'
      }}>
        <div className="dashboardCard" style={{ padding: '18px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>🚛</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#102a43' }}>{totalVehicles}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Vehicles</div>
            </div>
          </div>
        </div>
        <div className="dashboardCard" style={{ padding: '18px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>🔄</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#ed6c02' }}>{inTransit}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>In Transit</div>
            </div>
          </div>
        </div>
        <div className="dashboardCard" style={{ padding: '18px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>✅</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#16855b' }}>{delivered}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Delivered</div>
            </div>
          </div>
        </div>
        <div className="dashboardCard" style={{ padding: '18px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>⏳</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#c62828' }}>{pending}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              value={dailyTrackingSearch}
              onChange={(e) => setDailyTrackingSearch(e.target.value)}
              placeholder="Search by Vehicle No, Driver, Owner, Mobile..."
              style={{
                width: '100%',
                padding: '11px 14px 11px 40px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                background: '#fafbfc'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1769aa'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <button
            onClick={() => {
              setDailyTrackingSearch("");
            }}
            style={{
              padding: '11px 20px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#4b5563',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* VEHICLE CARDS GRID */}
      {filteredVehicles.length === 0 ? (
        <div className="card" style={{ padding: '60px 30px', textAlign: 'center', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
          <h3 style={{ color: '#102a43', margin: '0 0 8px 0', fontSize: '20px' }}>No Vehicles In Transit</h3>
          <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
            {dailyTrackingSearch ? `No results for "${dailyTrackingSearch}"` : 'No vehicles currently in transit.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '20px'
        }}>
          {filteredVehicles.map((vehicle) => {
            const statusInfo = getVehicleStatus(vehicle.id);
            const latestTrip = getLatestTrip(vehicle.id);
            const tripCount = getTripCount(vehicle.id);

            return (
              <div key={vehicle.id} className="card" style={{
                padding: '20px',
                borderRadius: '14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                borderLeft: `4px solid ${statusInfo.color}`,
                transition: 'all 0.3s ease',
                background: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#102a43', letterSpacing: '-0.3px' }}>
                      {vehicle.vehicleNo}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: '4px' }}>
                        🚗 {vehicle.vehicleType || 'N/A'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: '4px' }}>
                        📦 {tripCount} Trip{tripCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: statusInfo.bg,
                    color: statusInfo.color,
                    whiteSpace: 'nowrap'
                  }}>
                    {statusInfo.status}
                  </span>
                </div>

                {/* Driver, Owner & Mobile Details */}
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>👤 Owner</span>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#102a43' }}>{vehicle.ownerName || '-'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>🧑‍✈️ Driver</span>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#102a43' }}>
                        {vehicle.driverName || '-'}
                      </div>
                    </div>
                    {/* 🔥 DRIVER MOBILE NUMBER - SEPARATE ROW */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>📱 Driver Mobile</span>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#1769aa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {vehicle.driverMobile || '-'}
                        {vehicle.driverMobile && (
                          <a 
                            href={`tel:${vehicle.driverMobile}`}
                            style={{
                              fontSize: '12px',
                              background: '#e3f2fd',
                              padding: '2px 10px',
                              borderRadius: '4px',
                              color: '#1769aa',
                              textDecoration: 'none'
                            }}
                          >
                            📞 Call
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Details with Location */}
                {latestTrip && (
                  <div style={{ padding: '10px 14px', background: '#f0f7ff', borderRadius: '8px', marginBottom: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Route</span>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#102a43' }}>
                          {latestTrip.from || '-'} → {latestTrip.to || '-'}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Bilty</span>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#102a43' }}>{latestTrip.biltyNo || '-'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Freight</span>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#102a43' }}>₹{money(latestTrip.lorryFreight)}</div>
                      </div>
                    </div>
                    
                    {/* 🔥 CURRENT LOCATION - EDITABLE */}
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      background: '#e3f2fd', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>📍</span>
                        <div>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Current Location</span>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#102a43' }}>
                            {latestTrip.currentLocation || '📍 Update Location'}
                          </div>
                        </div>
                      </div>
                      
                      {/* 🔥 UPDATE LOCATION BUTTON */}
                      <button
                        style={{
                          padding: '6px 14px',
                          background: '#1769aa',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onClick={() => {
                          const location = prompt(`Enter current location for ${vehicle.vehicleNo}:`, latestTrip.currentLocation || '');
                          if (location !== null && location.trim() !== '') {
                            handleUpdateLocation(vehicle.id, location.trim());
                          }
                        }}
                      >
                        ✏️ Update Location
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button
                    className="blueBtn"
                    onClick={() => handleStatusUpdate(vehicle.id, "DISPATCHED")}
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', flex: 1, minWidth: '70px' }}
                  >
                    🚀 Dispatch
                  </button>
                  <button
                    className="blueBtn"
                    onClick={() => handleStatusUpdate(vehicle.id, "IN TRANSIT")}
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', flex: 1, minWidth: '70px', background: '#ed6c02', borderColor: '#ed6c02' }}
                  >
                    🚛 Transit
                  </button>
                  <button
                    className="greenBtn"
                    onClick={() => handleStatusUpdate(vehicle.id, "DELIVERED")}
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', flex: 1, minWidth: '70px' }}
                  >
                    ✅ Deliver
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER STATS */}
      <div style={{
        marginTop: '30px',
        padding: '16px 20px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Showing <strong style={{ color: '#102a43' }}>{filteredVehicles.length}</strong> vehicles in transit
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <span>🟦 <span style={{ color: '#102a43' }}>Dispatched</span></span>
          <span>🟧 <span style={{ color: '#102a43' }}>In Transit</span></span>
          <span>🟩 <span style={{ color: '#102a43' }}>Delivered</span></span>
        </div>
      </div>
    </>
  );
};
  // =========================================================
  // PROFESSIONAL BILTY PRINT
  // =========================================================

  const renderPrintBilty = () => {
    if (!printBilty) return null;

    const balance =
      Number(printBilty.freight || 0) -
      Number(printBilty.advance || 0);

    return (
      <div className="printOverlay">
        <div className="printDocument biltyPrintDocument">
          <div className="printHeader">
            <h1>{COMPANY.name}</h1>

            <p>{COMPANY.address}</p>

            <p>
              <strong>Mobile:</strong>{" "}
              {COMPANY.mobile}
            </p>

            <p>
              <strong>GSTIN/UIN:</strong>{" "}
              {COMPANY.gst}{" "}
              | <strong>State:</strong>{" "}
              {COMPANY.state}{" "}
              | <strong>Code:</strong>{" "}
              {COMPANY.code}
            </p>

            <p>
              <strong>E-Mail:</strong>{" "}
              {COMPANY.email}
            </p>
          </div>

          <div className="printTitle">
            CONSIGNMENT NOTE / BILTY
          </div>

          <div className="printSubTitle">
            TRANSPORT DOCUMENT
          </div>

          <div className="printInfo">
            <div>
              <strong>Bilty / CN Number</strong>
              <br />
              {printBilty.bilty}
            </div>

            <div>
              <strong>Booking Date</strong>
              <br />
              {formatDate(printBilty.date)}
            </div>
          </div>

          <div className="printParties">
            <div>
              <h3>CONSIGNOR — SENDER</h3>

              <strong>
                {printBilty.consignor}
              </strong>

              <p>
                {printBilty.consignorAddress}
              </p>

              <p>
                <strong>GSTIN:</strong>{" "}
                {printBilty.consignorGST}
              </p>
            </div>

            <div>
              <h3>CONSIGNEE — RECEIVER</h3>

              <strong>
                {printBilty.consignee}
              </strong>

              <p>
                {printBilty.consigneeAddress}
              </p>

              <p>
                <strong>GSTIN:</strong>{" "}
                {printBilty.consigneeGST}
              </p>
            </div>
          </div>

          <table className="printTable">
            <tbody>
              <tr>
                <th>FROM / PICKUP</th>
                <th>TO / DELIVERY</th>
                <th>VEHICLE NO.</th>
                <th>VEHICLE TYPE</th>
              </tr>

              <tr>
                <td>{printBilty.pickup}</td>
                <td>{printBilty.delivery}</td>
                <td>{printBilty.vehicle}</td>
                <td>{printBilty.vehicleType}</td>
              </tr>

              <tr>
                <th>MATERIAL</th>
                <th>ACTUAL WEIGHT</th>
                <th>CHARGE WEIGHT</th>
                <th>DRIVER</th>
              </tr>

              <tr>
                <td>{printBilty.material}</td>

                <td>
  {printBilty.actualWeight ? `${Number(printBilty.actualWeight).toLocaleString("en-IN")} KG` : "-"}
</td>

<td>
  {printBilty.chargeWeight ? `${Number(printBilty.chargeWeight).toLocaleString("en-IN")} KG` : "-"}
</td>

                <td>
                  {printBilty.driver}
                  <br />
                  {printBilty.driverMobile}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="freightTable">
            <tbody>
              <tr>
                <th>FREIGHT DETAILS</th>
                <th>AMOUNT</th>
              </tr>

              <tr>
                <td>Total Freight</td>
                <td>
                  ₹{money(printBilty.freight)}
                </td>
              </tr>

              <tr>
                <td>Advance Received</td>
                <td>
                  ₹{money(printBilty.advance)}
                </td>
              </tr>

              <tr>
                <th>BALANCE FREIGHT PAYABLE</th>
                <th>₹{money(balance)}</th>
              </tr>
            </tbody>
          </table>

          <table className="printTable">
            <tbody>
              <tr>
                <th>LOADING DATE</th>
                <th>EXPECTED DELIVERY</th>
                <th>STATUS</th>
              </tr>

              <tr>
                <td>
                  {formatDate(
                    printBilty.loadingDate
                  )}
                </td>

                <td>
                  {formatDate(
                    printBilty.expectedDelivery
                  )}
                </td>

                <td>{printBilty.status}</td>
              </tr>
            </tbody>
          </table>

          <div className="remarks">
            <strong>
              REMARKS / SPECIAL INSTRUCTIONS
            </strong>

            <p>
              {printBilty.remarks || "-"}
            </p>
          </div>

          <div className="terms">
            <h3>TERMS & CONDITIONS</h3>

            <ol>
              <li>
                Goods are transported at owner's
                risk unless otherwise agreed in
                writing.
              </li>

              <li>
                Consignor is responsible for
                correct description, quantity,
                weight and value of goods.
              </li>

              <li>
                Shortage or damage should be
                reported at the time of delivery.
              </li>

              <li>
                Freight and other charges are
                payable as agreed.
              </li>

              <li>
                Delivery will be made against
                proper acknowledgement from
                consignee.
              </li>

              <li>
                This Consignment Note is subject
                to applicable transport laws and
                regulations.
              </li>
            </ol>
          </div>

          <div className="signatures">
            <div>
              <strong>CONSIGNOR / SENDER</strong>
              <div className="signatureSpace">
                Signature
              </div>
            </div>

            <div>
              <strong>DRIVER / RECEIVER</strong>
              <div className="signatureSpace">
                Signature
              </div>
            </div>

            <div>
              <strong>
                FOR {COMPANY.name}
              </strong>
              <div className="signatureSpace">
                Authorized Signatory
              </div>
            </div>
          </div>

          <p className="computerGenerated">
            This is a computer generated transport
            document.
          </p>

          <div className="printButtons">
            <button
              className="greenBtn"
              onClick={() => window.print()}
            >
              PRINT BILTY
            </button>

            <button
              className="grayBtn"
              onClick={() => setPrintBilty(null)}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // PROFESSIONAL TRIP PRINT - UPDATED WITH HALTING ADDITION
  // IMPORTANT: BOOKING FREIGHT + MARGIN NOT PRINTED
  // =========================================================

  const renderPrintTrip = () => {
    if (!printTrip) return null;

    const hire = Number(printTrip.lorryFreight || 0);
    const advance = Number(printTrip.advance || 0);

    // 🔥 INDIVIDUAL ADDITIONS & DEDUCTIONS
    const damageAddition = Number(printTrip.damageAddition || 0);
    const haltingAddition = Number(printTrip.haltingAddition || 0);
    const otherAddition = Number(printTrip.otherAddition || 0);

    const damageDeduction = Number(printTrip.damageDeduction || 0);
    const haltingDeduction = Number(printTrip.haltingDeduction || 0);
    const otherDeduction = Number(printTrip.otherDeduction || 0);

    const totalAdditions = damageAddition + haltingAddition + otherAddition;
    const totalDeductions = damageDeduction + haltingDeduction + otherDeduction;

    const finalHire = hire + totalAdditions - totalDeductions;
    const balance = finalHire - advance;

    return (
      <div className="printOverlay">
        <div className="printDocument tripPrintDocument">
          <div className="printHeader">
            <h1>{COMPANY.name}</h1>
            <p>{COMPANY.address}</p>
            <p><strong>Mobile:</strong> {COMPANY.mobile}</p>
            <p><strong>GSTIN/UIN:</strong> {COMPANY.gst} | <strong>State:</strong> {COMPANY.state}</p>
            <p><strong>E-Mail:</strong> {COMPANY.email}</p>
          </div>

          <div className="printTitle">TRIP / DISPATCH DOCUMENT</div>
          <div className="printSubTitle">LORRY HIRE / TRANSPORT DISPATCH</div>

          <div className="printInfo">
            <div>
              <strong>Trip Number</strong>
              <br />
              {printTrip.tripNo}
            </div>
            <div>
              <strong>Trip Date</strong>
              <br />
              {formatDate(printTrip.tripDate)}
            </div>
            <div>
              <strong>Bilty Number</strong>
              <br />
              {printTrip.biltyNo}
            </div>
          </div>

          <div className="printParties">
            <div>
              <h3>ROUTE</h3>
              <p><strong>FROM:</strong> {printTrip.from}</p>
              <p><strong>TO:</strong> {printTrip.to}</p>
            </div>
            <div>
              <h3>BROKER</h3>
              <strong>{printTrip.brokerName || "-"}</strong>
              <p>Dispatch Status: {printTrip.status}</p>
            </div>
          </div>

          <table className="printTable">
            <tbody>
              <tr>
                <th>VEHICLE NO.</th>
                <th>VEHICLE TYPE</th>
                <th>DRIVER NAME</th>
                <th>DRIVER MOBILE</th>
              </tr>
              <tr>
                <td>{printTrip.vehicleNo}</td>
                <td>{printTrip.vehicleType}</td>
                <td>{printTrip.driverName}</td>
                <td>{printTrip.driverMobile}</td>
              </tr>
            </tbody>
          </table>

          {/* 🔥 UPDATED: LORRY HIRE WITH HALTING ADDITION */}
          <table className="freightTable">
            <tbody>
              <tr>
                <th>LORRY HIRE DETAILS</th>
                <th>AMOUNT</th>
              </tr>

              {/* Base Lorry Freight */}
              <tr>
                <td><strong>Lorry Freight / Hire</strong></td>
                <td><strong>₹{money(hire)}</strong></td>
              </tr>

              {/* 🔥 ADVANCE - SEPARATE */}
              <tr style={{ background: '#fff3e0' }}>
                <td><strong style={{ color: '#c62828' }}>ADVANCE PAID</strong></td>
                <td><strong style={{ color: '#c62828' }}>₹{money(advance)}</strong></td>
              </tr>

              {/* 🔥 HALTING ADDITION - SEPARATE */}
              <tr style={{ background: '#e3f2fd' }}>
                <td><strong style={{ color: '#1769aa' }}>HALTING ADDITION</strong></td>
                <td><strong style={{ color: '#1769aa' }}>₹{money(haltingAddition)}</strong></td>
              </tr>

              {/* Damage Addition - Only if > 0 */}
              {damageAddition > 0 && (
                <tr>
                  <td>Damage Addition</td>
                  <td>₹{money(damageAddition)}</td>
                </tr>
              )}

              {/* Other Addition - Only if > 0 */}
              {otherAddition > 0 && (
                <tr>
                  <td>Other Addition</td>
                  <td>₹{money(otherAddition)}</td>
                </tr>
              )}

              {/* Damage Deduction - Only if > 0 */}
              {damageDeduction > 0 && (
                <tr>
                  <td>Damage Deduction</td>
                  <td>₹{money(damageDeduction)}</td>
                </tr>
              )}

              {/* Halting Deduction - Only if > 0 */}
              {haltingDeduction > 0 && (
                <tr>
                  <td>Halting Deduction</td>
                  <td>₹{money(haltingDeduction)}</td>
                </tr>
              )}

              {/* Other Deduction - Only if > 0 */}
              {otherDeduction > 0 && (
                <tr>
                  <td>Other Deduction</td>
                  <td>₹{money(otherDeduction)}</td>
                </tr>
              )}

              {/* Total Addition */}
              <tr style={{ background: '#e8f5e9' }}>
                <td><strong>Total Addition</strong></td>
                <td><strong>₹{money(totalAdditions)}</strong></td>
              </tr>

              {/* Total Deduction */}
              <tr style={{ background: '#ffebee' }}>
                <td><strong>Total Deduction</strong></td>
                <td><strong>₹{money(totalDeductions)}</strong></td>
              </tr>

              {/* 🔥 FINAL LORRY HIRE */}
              <tr style={{ background: '#102a43', color: 'white' }}>
                <th style={{ color: 'white' }}>FINAL LORRY HIRE</th>
                <th style={{ color: 'white' }}>₹{money(finalHire)}</th>
              </tr>

              {/* 🔥 BALANCE PAYABLE */}
              <tr style={{ background: '#c62828', color: 'white' }}>
                <th style={{ color: 'white', fontSize: '16px' }}>BALANCE PAYABLE</th>
                <th style={{ color: 'white', fontSize: '18px' }}>₹{money(balance)}</th>
              </tr>
            </tbody>
          </table>

          <table className="printTable">
            <tbody>
              <tr>
                <th>RECEIVED DATE</th>
                <th>STATUS</th>
                <th>CLAIM AMOUNT</th>
              </tr>
              <tr>
                <td>{formatDate(printTrip.receivedDate)}</td>
                <td>{printTrip.status}</td>
                <td>₹{money(printTrip.claimAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="remarks">
            <strong>DAMAGE / CLAIM / SPECIAL INSTRUCTIONS</strong>
            <p>{printTrip.claimReason || "-"}</p>
            <p><strong>Remarks:</strong> {printTrip.remarks || "-"}</p>
          </div>

          <div className="signatures">
            <div>
              <strong>BROKER</strong>
              <div className="signatureSpace">Signature</div>
            </div>
            <div>
              <strong>DRIVER</strong>
              <div className="signatureSpace">Signature</div>
            </div>
            <div>
              <strong>FOR {COMPANY.name}</strong>
              <div className="signatureSpace">Authorized Signatory</div>
            </div>
          </div>

          <p className="computerGenerated">This is a computer generated transport document.</p>

          <div className="printButtons">
            <button className="greenBtn" onClick={() => window.print()}>PRINT TRIP</button>
            <button className="grayBtn" onClick={() => setPrintTrip(null)}>CLOSE</button>
          </div>
        </div>
      </div>
    );
  };
  // =========================================================
// PROFESSIONAL POD PRINT
// =========================================================

const renderPrintPOD = () => {
  if (!printPOD) return null;

  return (
    <div className="printOverlay">

      <div className="printDocument">

        <div className="printHeader">

          <h1>
            {COMPANY.name}
          </h1>

          <p>
            {COMPANY.address}
          </p>

          <p>
            <strong>Mobile:</strong>{" "}
            {COMPANY.mobile}
          </p>

          <p>
            <strong>GSTIN/UIN:</strong>{" "}
            {COMPANY.gst}
          </p>

          <p>
            <strong>E-Mail:</strong>{" "}
            {COMPANY.email}
          </p>

        </div>


        <div className="printTitle">
          PROOF OF DELIVERY
        </div>

        <div className="printSubTitle">
          POD / DELIVERY CONFIRMATION
        </div>


        <div className="printInfo">

          <div>
            <strong>POD Number</strong>
            <br />
            {printPOD.podNo}
          </div>

          <div>
            <strong>Trip Number</strong>
            <br />
            {printPOD.tripNo}
          </div>

          <div>
            <strong>Bilty Number</strong>
            <br />
            {printPOD.biltyNo}
          </div>

        </div>


        <div className="printParties">

          <div>

            <h3>
              CONSIGNOR
            </h3>

            <strong>
              {printPOD.consignor ||
                "-"}
            </strong>

          </div>


          <div>

            <h3>
              CONSIGNEE
            </h3>

            <strong>
              {printPOD.consignee ||
                "-"}
            </strong>

          </div>

        </div>


        <table className="printTable">

          <tbody>

            <tr>

              <th>
                FROM
              </th>

              <th>
                TO
              </th>

              <th>
                VEHICLE
              </th>

              <th>
                DRIVER
              </th>

            </tr>


            <tr>

              <td>
                {printPOD.from}
              </td>

              <td>
                {printPOD.to}
              </td>

              <td>
                {printPOD.vehicleNo}
              </td>

              <td>
                {printPOD.driverName}
                <br />
                {printPOD.driverMobile}
              </td>

            </tr>


            <tr>

              <th>
                DISPATCH DATE
              </th>

              <th>
                DELIVERY DATE
              </th>

              <th>
                STATUS
              </th>

              <th>
                RECEIVED BY
              </th>

            </tr>


            <tr>

              <td>
                {formatDate(
                  printPOD.dispatchDate
                )}
              </td>

              <td>
                {formatDate(
                  printPOD.deliveryDate
                )}
              </td>

              <td>
                {printPOD.status}
              </td>

              <td>
                {printPOD.receivedBy}
                <br />
                {printPOD.receiverMobile}
              </td>

            </tr>

          </tbody>

        </table>


        <table className="freightTable">

          <tbody>

            <tr>
              <th>
                DAMAGE / CLAIM DETAILS
              </th>

              <th>
                AMOUNT
              </th>
            </tr>


            <tr>
              <td>
                Shortage Amount
              </td>

              <td>
                ₹
                {money(
                  printPOD.shortageAmount
                )}
              </td>
            </tr>


            <tr>
              <td>
                Damage Amount
              </td>

              <td>
                ₹
                {money(
                  printPOD.damageAmount
                )}
              </td>
            </tr>


            <tr>
              <td>
                Claim Amount
              </td>

              <td>
                ₹
                {money(
                  printPOD.claimAmount
                )}
              </td>
            </tr>

          </tbody>

        </table>


        <div className="remarks">

          <strong>
            DELIVERY REMARKS
          </strong>

          <p>
            {printPOD.remarks ||
              "-"}
          </p>

        </div>


        <div className="signatures">

          <div>
            <strong>
              RECEIVER
            </strong>

            <div className="signatureSpace">
              Signature
            </div>
          </div>


          <div>
            <strong>
              DRIVER
            </strong>

            <div className="signatureSpace">
              Signature
            </div>
          </div>


          <div>
            <strong>
              FOR {COMPANY.name}
            </strong>

            <div className="signatureSpace">
              Authorized Signatory
            </div>
          </div>

        </div>


        <p className="computerGenerated">
          This is a computer generated
          Proof of Delivery document.
        </p>


        <div className="printButtons">

          <button
            className="greenBtn"
            onClick={() =>
              window.print()
            }
          >
            PRINT POD
          </button>


          <button
            className="grayBtn"
            onClick={() =>
              setPrintPOD(null)
            }
          >
            CLOSE
          </button>

        </div>

      </div>

    </div>
  );
};

const getNextMoneyReceiptNumber = () => {
  const year = new Date().getFullYear();

  const existingNumbers = accounts
    .filter((item) => item.type === "RECEIPT")
    .map((item) => {
      const receiptNo = String(
        item.moneyReceiptNo || ""
      );

      const match = receiptNo.match(
        /MR-\d{4}-(\d+)/
      );

      return match
        ? Number(match[1])
        : 0;
    });

  const nextNumber =
    existingNumbers.length > 0
      ? Math.max(...existingNumbers) + 1
      : 1;

  return `MR-${year}-${String(
    nextNumber
  ).padStart(4, "0")}`;
};

// =========================================================
// PROFESSIONAL MONEY RECEIPT PRINT
// =========================================================
  // =========================================================
  // PENDING BILL GENERATE MODAL
  // =========================================================

  const renderPendingBillModal = () => {
    if (!showBillGenerateModal) return null;

    const handleGenerateBill = async () => {
  if (!pendingBillData.partyName.trim()) {
    alert("Please enter Party Name.");
    return;
  }

  // 🔥 AUTO BILL NUMBER GENERATE
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const existingBills = bills.filter(b => 
    b.billNo && b.billNo.startsWith(`INV-${year}-${month}`)
  );
  const autoBillNo = `INV-${year}-${month}-${String(existingBills.length + 1).padStart(4, '0')}`;

  // 🔥 ITEMS KO STRING MEIN CONVERT KARO (Supabase compatibility)
  const itemsArray = (pendingBillData.items.length > 0 ? pendingBillData.items : [{
    id: Date.now(),
    description: `Lorry Freight - ${pendingBillData.biltyNo || "Pending"}`,
    subDescription: "",
    date: new Date().toISOString().slice(0, 10),
    cnNo: pendingBillData.biltyNo || "",
    lorryNo: "",
    actualWeight: "",
    chargeWeight: "",
    rate: pendingBillData.pending || 0,
    amount: pendingBillData.pending || 0,
    hsn: "996519"
  }]).map(i => ({
    ...i,
    rate: String(i.rate || 0),
    amount: String(i.amount || 0),
    quantity: String(i.quantity || 1),
    actualWeight: String(i.actualWeight || 0),
    chargeWeight: String(i.chargeWeight || 0),
  }));

  const newBill = {
    billNo: autoBillNo,
    date: new Date().toISOString().slice(0, 10),
    partyName: pendingBillData.partyName,
    partyGST: pendingBillData.partyGST || "",
    partyAddress: pendingBillData.partyAddress || "",
    billType: "TAX INVOICE",
    vchNo: `VCH-${pendingBillData.biltyNo || Date.now()}`,
    biltyNo: pendingBillData.biltyNo || "",  // 🔥 IMPORTANT
    items: itemsArray,
    subtotal: String(pendingBillData.pending || 0),
    cgst: "0",
    sgst: "0",
    total: String(pendingBillData.pending || 0),
    igstRate: "5",
    remarks: `Generated from pending bilty ${pendingBillData.biltyNo || ""}`,
    createdAt: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('bills').insert([newBill]);
    if (error) throw error;

    alert(`✅ Bill ${autoBillNo} generated successfully!`);
    setShowBillGenerateModal(false);
    await loadAllData();
  } catch (e) {
    alert("❌ Error: " + e.message);
  }
};

    return (
      <div className="printOverlay" onClick={() => setShowBillGenerateModal(false)}>
        <div 
          className="printDocument" 
          style={{ 
            maxWidth: '600px', 
            margin: '50px auto', 
            padding: '30px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ margin: '0 0 20px 0', color: '#102a43', borderBottom: '2px solid #102a43', paddingBottom: '10px' }}>
            ⏳ Generate Bill from Pending Bilty
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>
              Bilty No. <span style={{ color: '#666', fontWeight: 'normal' }}>({pendingBillData.biltyNo || "-"})</span>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>
              Total Freight: ₹{money(pendingBillData.totalFreight)} | Received: ₹{money(pendingBillData.received)} | 
              <span style={{ color: '#c62828' }}> Pending: ₹{money(pendingBillData.pending)}</span>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>
              Party Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={pendingBillData.partyName}
              onChange={(e) => setPendingBillData(prev => ({ ...prev, partyName: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Enter Party Name"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>
              GSTIN
            </label>
            <input
              type="text"
              value={pendingBillData.partyGST}
              onChange={(e) => setPendingBillData(prev => ({ ...prev, partyGST: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Enter GSTIN (Optional)"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>
              Address
            </label>
            <textarea
              value={pendingBillData.partyAddress}
              onChange={(e) => setPendingBillData(prev => ({ ...prev, partyAddress: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '60px',
                resize: 'vertical'
              }}
              placeholder="Enter Address (Optional)"
            />
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
            borderTop: '1px solid #eee',
            paddingTop: '15px'
          }}>
            <button
              className="grayBtn"
              onClick={() => setShowBillGenerateModal(false)}
              style={{ padding: '10px 24px' }}
            >
              CANCEL
            </button>
            <button
              className="greenBtn"
              onClick={handleGenerateBill}
              style={{ padding: '10px 24px' }}
            >
              ✅ GENERATE BILL
            </button>
          </div>
        </div>
      </div>
    );
  };
const renderPrintMoneyReceipt = () => {
  if (!printMoneyReceipt) return null;

  const receipt = printMoneyReceipt;

  const receiptBills =
    receipt.billIds || [];
      // CUSTOMER MASTER SE ADDRESS + GST FETCH
  const receiptCustomer = customers.find(
    (item) =>
      String(item.name || "")
        .trim()
        .toUpperCase() ===
      String(receipt.partyName || "")
        .trim()
        .toUpperCase()
  );

  const customerAddress =
    receiptCustomer?.address || "";

  const customerGST =
    receiptCustomer?.gst ||
    receiptCustomer?.gstin ||
    "";

  return (
    <div className="printOverlay">

      <div className="printDocument">

        {/* HEADER */}

        <div className="printHeader">

          <h1>
            {COMPANY.name}
          </h1>

          <p>
            {COMPANY.address}
          </p>

          <p>
            <strong>Mobile:</strong>{" "}
            {COMPANY.mobile}
          </p>

          <p>
            <strong>GSTIN/UIN:</strong>{" "}
            {COMPANY.gst}
          </p>

          <p>
            <strong>E-Mail:</strong>{" "}
            {COMPANY.email}
          </p>

        </div>


        {/* TITLE */}

        <div className="printTitle">
          MONEY RECEIPT
        </div>

        <div className="printSubTitle">
          PAYMENT RECEIPT / ACKNOWLEDGEMENT
        </div>


        {/* RECEIPT INFO */}

        <div className="printInfo">

          <div>
            <strong>
              Money Receipt No.
            </strong>

            <br />

            {receipt.moneyReceiptNo ||
              "-"}
          </div>


          <div>
            <strong>
              Receipt Date
            </strong>

            <br />

            {formatDate(
              receipt.date
            )}
          </div>


          <div>
            <strong>
              Payment Mode
            </strong>

            <br />

            {receipt.paymentMode ||
              "-"}
          </div>

        </div>


        {/* PARTY */}

<div className="printParties">

  <div>

    <h3>
      RECEIVED FROM
    </h3>

    <strong>
      {receipt.partyName || "-"}
    </strong>

    <p>
      <strong>Address:</strong>{" "}
      {customerAddress || "-"}
    </p>

    <p>
      <strong>GSTIN:</strong>{" "}
      {customerGST || "-"}
    </p>

  </div>


  <div>

    <h3>
      REFERENCE
    </h3>

    <strong>
      {receipt.referenceNo || "-"}
    </strong>

  </div>

</div>

        {/* AMOUNT */}

        <table className="freightTable">

          <tbody>

            <tr>

              <th>
                PARTICULAR
              </th>

              <th>
                AMOUNT
              </th>

            </tr>


            <tr>

              <td>
                Payment / Receipt Amount
              </td>

              <td>
                ₹
                {money(
                  receipt.amount
                )}
              </td>

            </tr>


            <tr>

              <th>
                TOTAL RECEIVED
              </th>

              <th>
                ₹
                {money(
                  receipt.amount
                )}
              </th>

            </tr>

          </tbody>

        </table>


        {/* BILL DETAILS */}

        {receiptBills.length > 0 && (

          <div
            style={{
              marginTop: "20px",
            }}
          >

            <h3>
              BILL / BILTY ADJUSTMENT
            </h3>


            <table className="printTable">

              <thead>

                <tr>

                  <th>
                    BILTY NO.
                  </th>

                  <th>
                    ADJUSTMENT
                  </th>

                  <th>
                    TDS
                  </th>

                  <th>
                    DEDUCTION
                  </th>

                </tr>

              </thead>


              <tbody>

                {receiptBills.map(
                  (billId) => {

                    const bill =
                      bilties.find(
                        (item) =>
                          String(
                            item.id
                          ) ===
                          String(
                            billId
                          )
                      );

                    if (!bill) {
                      return null;
                    }

                    return (
                      <tr
                        key={billId}
                      >

                        <td>
                          {bill.bilty ||
                            "-"}
                        </td>

                        <td>
                          ₹
                          {money(
                            receipt
                              .billAllocations
                              ?.[
                                billId
                              ] || 0
                          )}
                        </td>

                        <td>
                          ₹
                          {money(
                            receipt
                              .billTds
                              ?.[
                                billId
                              ] || 0
                          )}
                        </td>

                        <td>
                          ₹
                          {money(
                            receipt
                              .billDeductions
                              ?.[
                                billId
                              ] || 0
                          )}
                        </td>

                      </tr>
                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}


        {/* REMARKS */}

        <div className="remarks">

          <strong>
            REMARKS
          </strong>

          <p>
            {receipt.remarks ||
              "-"}
          </p>

        </div>


        {/* SIGNATURE */}

        <div className="signatures">

          <div>
            <strong>
              RECEIVED BY
            </strong>

            <div className="signatureSpace">
              Signature
            </div>
          </div>


          <div>
            <strong>
              PARTY
            </strong>

            <div className="signatureSpace">
              Signature
            </div>
          </div>


          <div>
            <strong>
              FOR {COMPANY.name}
            </strong>

            <div className="signatureSpace">
              Authorized Signatory
            </div>
          </div>

        </div>


        <p className="computerGenerated">
          This is a computer generated
          Money Receipt.
        </p>


        {/* BUTTONS */}

        <div className="printButtons">

          <button
            className="greenBtn"
            onClick={() =>
              window.print()
            }
          >
            PRINT RECEIPT
          </button>


          <button
            className="grayBtn"
            onClick={() =>
              setPrintMoneyReceipt(null)
            }
          >
            CLOSE
          </button>

        </div>

      </div>

    </div>
  );
};

  // =========================================================
  // PROFESSIONAL BILL PRINT - TALLY STYLE
  // =========================================================
    const renderPrintBill = () => {
    if (!printBill) return null;

    // Calculate totals
    const totalAmount = printBill.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const taxableValue = totalAmount;
    const igstRate = printBill.igstRate || 5;
    const igstAmount = (taxableValue * igstRate) / 100;
    const grandTotal = taxableValue + igstAmount;

    // Format date
    const billDate = printBill.date || new Date().toISOString().slice(0, 10);

    // Number to words function
    const numberToWords = (num) => {
      if (num === 0) return 'Zero';
      
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      const numToWords = (n) => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
        if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
        if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
        return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
      };
      
      const rupees = Math.floor(num);
      const paise = Math.round((num - rupees) * 100);
      
      let result = numToWords(rupees) + ' Rupees';
      if (paise > 0) {
        result += ' and ' + numToWords(paise) + ' Paise';
      }
      return result;
    };

    return (
      <div className="printOverlay">
        <div className="printDocument" style={{
          border: '2px solid #000',
          padding: '8mm',
          background: 'white',
          fontFamily: 'Arial, Helvetica, sans-serif',
          maxWidth: '210mm',
          margin: '0 auto'
        }}>
          
          {/* ===== SECTION 1: COMPANY HEADER ===== */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <h1 style={{ margin: '0', fontSize: '22px', fontWeight: '800' }}>{COMPANY.name}</h1>
            <p style={{ margin: '5px 0', fontSize: '10px' }}>{COMPANY.address}</p>
            <p style={{ margin: '3px 0', fontSize: '9px' }}>
              {COMPANY.mobile} | GSTIN/UIN: {COMPANY.gst}
            </p>
            <p style={{ margin: '3px 0', fontSize: '9px' }}>
              State Name : {COMPANY.state}, Code : {COMPANY.code}
            </p>
            <p style={{ margin: '3px 0', fontSize: '9px' }}>
              E-Mail : {COMPANY.email}
            </p>
          </div>

             {/* ===== INVOICE NO. & DATE ===== */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            border: '1px solid #000',
            marginTop: '10px'
          }}>
            <div style={{
              padding: '6px 10px',
              borderRight: '1px solid #000',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <strong>Invoice No.</strong>
              <span>{printBill.billNo || "-"}</span>
            </div>
            <div style={{
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <strong>Dated</strong>
              <span>{formatDate(billDate)}</span>
            </div>
          </div>
                        {/* ===== SECTION 2: BUYER (BILL TO) - LEFT SIDE ===== */}
          <div style={{
            border: '1px solid #000',
            marginTop: '10px',
            padding: '12px 15px',
            textAlign: 'left'
          }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '11px',
              borderBottom: '1px solid #000',
              paddingBottom: '5px',
              marginBottom: '8px',
              textAlign: 'left'
            }}>
              Buyer (Bill to)
            </div>
            <div style={{
              fontWeight: 'bold',
              fontSize: '11px',
              marginTop: '5px',
              textAlign: 'left'
            }}>
              {printBill.partyName || "-"}
            </div>
            <div style={{
              fontSize: '10px',
              marginTop: '3px',
              lineHeight: '1.5',
              textAlign: 'left'
            }}>
              {printBill.partyAddress || "-"}
            </div>
            <div style={{
              fontSize: '10px',
              marginTop: '4px',
              textAlign: 'left'
            }}>
              <span style={{ fontWeight: 'bold' }}>GSTIN/UIN :</span> {printBill.partyGST || "-"}
            </div>
            <div style={{
              fontSize: '10px',
              marginTop: '2px',
              textAlign: 'left'
            }}>
              <span style={{ fontWeight: 'bold' }}>State Name :</span> West Bengal, Code : 19
            </div>
          </div>
          {/* ===== SECTION 7: MAIN TABLE ===== */}
          <table style={{
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '10px',
  fontSize: '9px',
  border: '1px solid #000'
}}>
  <thead>
    <tr>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'center', width: '5%' }}>#</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'left', width: '20%' }}>Particulars</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'center', width: '10%' }}>Date</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'center', width: '10%' }}>C.N. No.</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'center', width: '12%' }}>Lorry No.</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'center', width: '8%' }}>Act. Wt</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'center', width: '8%' }}>Chg. Wt</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'right', width: '12%' }}>Rate (₹)</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'right', width: '15%' }}>Amount (₹)</th>
    </tr>
  </thead>
  <tbody>
    {printBill.items && printBill.items.length > 0 ? (
      printBill.items.map((item, index) => (
        <tr key={item.id || index}>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{index + 1}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>
            <strong>{item.description || "-"}</strong>
            {item.subDescription && (
              <div style={{ fontSize: '7px', color: '#555' }}>{item.subDescription}</div>
            )}
          </td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{item.date ? formatDate(item.date) : formatDate(billDate)}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{item.cnNo || printBill.biltyNo || "-"}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{item.lorryNo || printBill.vehicleNo || "-"}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{item.actualWeight || item.quantity || '-'}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{item.chargeWeight || item.quantity || '-'}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>{money(item.rate || 0)}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{money(item.amount || 0)}</td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="9" style={{ border: '1px solid #000', padding: '20px', textAlign: 'center' }}>No items in this bill</td>
      </tr>
    )}
  </tbody>
  <tfoot>
    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
      <td colSpan="8" style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>TOTAL</td>
      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{money(totalAmount)}</td>
    </tr>
  </tfoot>
</table>
                 {/* ===== SECTION 8: AMOUNT IN WORDS - LEFT ALIGNED ===== */}
          <div style={{
            border: '1px solid #000',
            marginTop: '10px',
            padding: '8px 12px',
            background: '#f9f9f9',
            textAlign: 'left'
          }}>
            <strong style={{ display: 'block', textAlign: 'left' }}>Amount Chargeable (in words)</strong>
            <div style={{
              fontWeight: 'bold',
              fontSize: '11px',
              textAlign: 'left',
              marginTop: '2px'
            }}>
              {numberToWords(totalAmount)} Only
            </div>
          </div>
          {/* ===== SECTION 9: TAX TABLE ===== */}
          <table style={{
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '10px',
  fontSize: '9px',
  border: '1px solid #000'
}}>
  <thead>
    <tr>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'left' }}>HSN/SAC</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'right' }}>Taxable Value</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'right' }}>IGST 5%</th>
      <th style={{ border: '1px solid #000', padding: '6px', background: '#102a43', color: 'white', textAlign: 'right' }}>Total</th>
    </tr>
  </thead>
  <tbody>
    {printBill.items && printBill.items.length > 0 ? (
      printBill.items.map((item, index) => (
        <tr key={`tax-${index}`}>
          <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{item.hsn || "996519"}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>{money(item.amount || 0)}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>{money((item.amount || 0) * ((printBill.igstRate || 5) / 100))}</td>
          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>{money((item.amount || 0) * ((printBill.igstRate || 5) / 100))}</td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="4" style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>No items</td>
      </tr>
    )}
  </tbody>
  <tfoot>
    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
      <td style={{ border: '1px solid #000', padding: '6px' }}>Total</td>
      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{money(taxableValue)}</td>
      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{money(igstAmount)}</td>
      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{money(igstAmount)}</td>
    </tr>
  </tfoot>
</table>

                  {/* ===== SECTION 10: TAX AMOUNT IN WORDS - LEFT ALIGNED ===== */}
          <div style={{
            border: '1px solid #000',
            marginTop: '10px',
            padding: '8px 12px',
            background: '#f9f9f9',
            textAlign: 'left'
          }}>
            <strong style={{ display: 'block', textAlign: 'left' }}>Tax Amount (in words)</strong>
            <div style={{
              fontWeight: 'bold',
              fontSize: '11px',
              textAlign: 'left',
              marginTop: '2px'
            }}>
              {numberToWords(igstAmount)} Only
            </div>
          </div>
                   {/* ===== SECTION 11: REVERSE CHARGE - LEFT ALIGNED ===== */}
          <div style={{
            border: '1px solid #000',
            marginTop: '10px',
            padding: '6px 12px',
            fontWeight: 'bold',
            fontSize: '10px',
            background: '#fff3e0',
            textAlign: 'left'
          }}>
            Amount of tax subject to Reverse Charge
          </div>
        

          {/* ===== SECTION 13: SIGNATURE ===== */}
          <div style={{
            marginTop: '30px',
            paddingTop: '15px',
            borderTop: '2px solid #000',
            textAlign: 'right'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>for {COMPANY.name}</div>
            <div style={{
              borderTop: '2px solid #000',
              paddingTop: '10px',
              marginTop: '30px',
              minHeight: '45px',
              width: '200px',
              marginLeft: 'auto'
            }}>
              (Authorized Signatory)
            </div>
          </div>

          {/* ===== SECTION 14: COMPUTER GENERATED ===== */}
          <p style={{ textAlign: 'center', fontSize: '8px', color: '#666', marginTop: '10px' }}>
            This is a computer generated invoice.
          </p>

          {/* ===== BUTTONS ===== */}
          <div className="printButtons" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
            <button className="greenBtn" onClick={() => window.print()}>🖨️ PRINT BILL</button>
            <button className="grayBtn" onClick={() => setPrintBill(null)}>✕ CLOSE</button>
          </div>
        </div>
      </div>
    );
  };
  // =========================================================
  // BACKUP & RESTORE FUNCTIONS
  // =========================================================

const backupData = () => {
  alert("✅ Data automatically cloud (Supabase) mein safe hai. Manual backup ki zarurat nahi hai.");
};
  const restoreData = () => {
  alert("❌ Data cloud se already restore ho chuka hai. Manual restore nahi hoga.");
};

// =========================================================
// EXCEL EXPORT FUNCTION
// =========================================================

const exportToExcel = (data, filename, headers) => {
  if (!data || data.length === 0) {
    alert("❌ No data to export!");
    return;
  }

  try {
    const exportData = data.map((item) => {
      const row = {};
      headers.forEach((h) => {
        row[h.label] = item[h.key] || "-";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ ${data.length} records exported!`);
  } catch (e) {
    alert("❌ Error: " + e.message);
  }
};

// =========================================================
  // LOGIN CHECK
  // =========================================================

  if (!isLoggedIn) {
    return (
      <div className="app">
        <header className="header">
          <div>
            <h1>{COMPANY.name}</h1>
            <p>Transport Management System</p>
          </div>
          <div className="headerRight">
            <strong>GSTIN: {COMPANY.gst}</strong>
          </div>
        </header>
        {renderLoginPage()}
      </div>
    );
  }
  // =========================================================
  // MAIN LAYOUT
  // =========================================================
  return (
    <div className="app">
<header className="header">
  <div>
    <h1>{COMPANY.name}</h1>

    <p>
      Transport Management System
    </p>
  </div>

  <div className="headerRight">
    <strong>
      GSTIN: {COMPANY.gst}
    </strong>
  </div>
</header>
      <div className="layout">
        <aside className="sidebar">
  <button
    className={page === "dashboard" ? "navActive" : ""}
    onClick={() => { setPage("dashboard"); goTop(); }}
  >
    🏠 Dashboard
  </button>

  <button onClick={logout} style={{ background: '#c62828', color: 'white', marginTop: '20px' }}>
    🚪 LOGOUT
  </button>

  {/* ===== SABHI PAGES (HAR ROLE KE LIYE) ===== */}
  <button onClick={() => setPage("customers")}>👥 Customer Master</button>
  <button onClick={() => setPage("vehicles")}>🚛 Vehicle Master</button>
  <button onClick={() => setPage("bilty")}>🧾 Bilty / CN</button>
<button onClick={() => setPage("trips")}>📦 LHC / Dispatch</button>
  <button onClick={() => setPage("lhb")}>💰 Lorry Hire Balance</button>
  <button onClick={() => setPage("accounts")}>💰 Accounts</button>
  <button onClick={() => setPage("bills")}>🧾 Bills / Invoice</button>
  <button onClick={() => setPage("reports")}>📊 Reports</button>
  <button onClick={() => setPage("tracking")}>📦 Consignment Tracking</button>
  <button onClick={() => setPage("dailyTracking")}>🚚 Daily Tracking</button>  {/* 🔥 YEH ADD KARO */}
    <button onClick={() => setPage("customerVisits")}>📋 Customer Visits</button>

</aside>
<main className="content">
  {page === "dashboard" && renderDashboard()}
  {page === "customers" && renderCustomerMaster()}
  {page === "vehicles" && renderVehicleMaster()}
  {page === "bilty" && renderBiltyPage()}
  {page === "trips" && renderTripPage()}
  {page === "pod" && renderPODPage()}
  {page === "lhb" && renderLHBalancePage()}
  {page === "accounts" && renderAccountsPage()}
  {page === "bills" && renderBillPage()}
  {page === "reports" && renderReportsPage()}
  {page === "tracking" && renderTrackingPage()}
    {page === "dailyTracking" && renderDailyTrackingPage()}
      {page === "customerVisits" && renderCustomerVisitsPage()}

</main>
      </div>

      {/* ===== RESET PASSWORD MODAL ===== */}
{showResetPassword && (
  <div className="printOverlay" onClick={() => setShowResetPassword(false)}>
    <div 
      className="printDocument" 
      style={{ 
        maxWidth: '450px', 
        margin: '80px auto', 
        padding: '30px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 style={{ margin: '0 0 5px 0', color: '#102a43' }}>🔐 Reset Password</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Enter your new password below
      </p>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>
          New Password *
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>
          Confirm Password *
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          className="grayBtn"
          onClick={() => {
            setShowResetPassword(false);
            setNewPassword("");
            setConfirmPassword("");
          }}
          style={{ padding: '10px 24px' }}
        >
          CANCEL
        </button>
        <button
          className="greenBtn"
          onClick={async () => {
            if (newPassword.length < 6) {
              alert("Password at least 6 characters long hona chahiye.");
              return;
            }
            if (newPassword !== confirmPassword) {
              alert("Passwords match nahi kar rahe. Please re-enter.");
              return;
            }

            const { data, error } = await supabase.auth.updateUser({
              password: newPassword
            });

            if (error) {
              alert("❌ Error: " + error.message);
            } else {
              alert("✅ Password updated successfully!");
              setShowResetPassword(false);
              setNewPassword("");
              setConfirmPassword("");
            }
          }}
          style={{ padding: '10px 24px' }}
        >
          UPDATE PASSWORD
        </button>
      </div>
    </div>
  </div>
)}

      <footer>
        {COMPANY.name} © 2026 | Transport Management System
      </footer>



      {printBilty && renderPrintBilty()}
      {printTrip && renderPrintTrip()}
      {printPOD && renderPrintPOD()}
      {printMoneyReceipt &&
        renderPrintMoneyReceipt()}
              {showBillGenerateModal && renderPendingBillModal()}
      {printBill && renderPrintBill()}
    </div>
    
  );
}

export default App;