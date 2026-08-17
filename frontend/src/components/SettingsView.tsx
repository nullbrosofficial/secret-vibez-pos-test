import React, { useState, useMemo } from "react";
import { StaffAccount, MenuItem, Customer, Bill, AuthUser, UserAccount } from "../types";
import { 
  Building2, Percent, Printer, Users, Database, 
  Check, Download, Upload, Trash2, Plus, RefreshCw, 
  FileText, ShieldAlert, Sparkles, Store, Receipt, 
  Coins, CheckCircle2, AlertTriangle, ShieldCheck, 
  UserPlus, HelpCircle, HardDrive, Smartphone,
  SlidersHorizontal, ChevronRight, Eye, Shield, Lock, Edit, Search, CheckCircle, XCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../api";

interface SettingsViewProps {
  authUser?: AuthUser | null;
  businessName: string;
  setBusinessName: (name: string) => void;
  businessLogo: string;
  setBusinessLogo: (logo: string) => void;
  isWhatsAppConnected?: boolean;
  setIsWhatsAppConnected?: (connected: boolean) => void;
  isGstEnabled: boolean;
  setIsGstEnabled: (enabled: boolean) => void;
  gstRate: number;
  setGstRate: (rate: number) => void;
  menuItems?: MenuItem[];
  customers?: Customer[];
  bills?: Bill[];
  onRestoreData?: (data: {
    businessName?: string;
    businessLogo?: string;
    gstRate?: number;
    isGstEnabled?: boolean;
    menuItems?: MenuItem[];
    customers?: Customer[];
    bills?: Bill[];
    staff?: StaffAccount[];
  }) => void;
  onResetTransactions?: () => void;
}

type SettingsTab = "profile" | "billing" | "receipt" | "backup" | "users";

export default function SettingsView({
  authUser,
  businessName,
  setBusinessName,
  businessLogo,
  setBusinessLogo,
  isGstEnabled,
  setIsGstEnabled,
  gstRate,
  setGstRate,
  menuItems = [],
  customers = [],
  bills = [],
  onRestoreData,
  onResetTransactions
}: SettingsViewProps) {
  // Tab navigation
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // User Management State
  const queryClient = useQueryClient();
  const { data: usersList = [], refetch: refetchUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.list(),
    enabled: authUser?.role === "owner"
  });

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form inputs
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"CASHIER" | "WAITER" | "CHEF">("CASHIER");
  const [userPassword, setUserPassword] = useState("");
  const [userConfirmPassword, setUserConfirmPassword] = useState("");
  const [userActive, setUserActive] = useState(true);

  const [resetPass, setResetPass] = useState("");
  const [resetPassConfirm, setResetPassConfirm] = useState("");

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreateModal(false);
      showToast("User account created successfully.");
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      setUserConfirmPassword("");
      setUserActive(true);
    },
    onError: (err: any) => {
      showToast(`Error: ${err.message || "Failed to create user"}`);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowEditModal(false);
      showToast("User account updated successfully.");
    },
    onError: (err: any) => {
      showToast(`Error: ${err.message || "Failed to update user"}`);
    }
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => userApi.updateStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("User account status toggled successfully.");
    },
    onError: (err: any) => {
      showToast(`Error: ${err.message || "Failed to change user status"}`);
    }
  });

  const resetUserPasswordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => userApi.resetPassword(id, data),
    onSuccess: () => {
      setShowResetPassModal(false);
      setResetPass("");
      setResetPassConfirm("");
      showToast("User password updated successfully.");
    },
    onError: (err: any) => {
      showToast(`Error: ${err.message || "Failed to reset password"}`);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowDeleteConfirm(false);
      showToast(res.message || "User account deleted successfully.");
    },
    onError: (err: any) => {
      showToast(`Error: ${err.message || "Failed to delete user"}`);
    }
  });

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return usersList;
    const q = userSearchQuery.toLowerCase();
    return usersList.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [usersList, userSearchQuery]);

  const handleEditClick = (u: UserAccount) => {
    setSelectedUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role.toUpperCase() as any);
    setUserActive(u.active);
    setShowEditModal(true);
  };

  const handleResetPassClick = (u: UserAccount) => {
    setSelectedUser(u);
    setResetPass("");
    setResetPassConfirm("");
    setShowResetPassModal(true);
  };

  const handleDeleteClick = (u: UserAccount) => {
    setSelectedUser(u);
    setShowDeleteConfirm(true);
  };

  const handleToggleStatusClick = (u: UserAccount) => {
    updateUserStatusMutation.mutate({ id: u.id, active: !u.active });
  };

  // Store Profile local state
  const [tagline, setTagline] = useState("Food & Stay");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("Beach Road, Calangute, Goa 403516");
  const [fssaiNumber, setFssaiNumber] = useState("11521019000452");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [currencyCode, setCurrencyCode] = useState("INR");

  // Billing & Tax additional local state
  const [gstinNumber, setGstinNumber] = useState("30AABCS1429B1Z8");
  const [isServiceChargeEnabled, setIsServiceChargeEnabled] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(5);
  const [isRoundOffEnabled, setIsRoundOffEnabled] = useState(true);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("UPI");

  // Receipt & Printer local state
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [receiptHeaderMessage, setReceiptHeaderMessage] = useState("Welcome to Secret Vibez • Food & Stay");
  const [receiptFooterMessage, setReceiptFooterMessage] = useState("Thank you for dining with us! Follow us @secretvibez");
  const [showTaxBreakupOnReceipt, setShowTaxBreakupOnReceipt] = useState(true);
  const [autoPrintKOT, setAutoPrintKOT] = useState(true);
  const [showFssaiOnReceipt, setShowFssaiOnReceipt] = useState(true);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Backup & Reset states
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupProgressPercent, setBackupProgressPercent] = useState(0);
  const [backupTimeString, setBackupTimeString] = useState("Today, 02:00 AM");
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export system backup to JSON file
  const handleExportBackup = () => {
    setIsBackupInProgress(true);
    setBackupProgressPercent(0);

    const interval = setInterval(() => {
      setBackupProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackupInProgress(false);
          const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setBackupTimeString(`Today, ${nowStr}`);

          // Create JSON payload
          const backupPayload = {
            version: "2.4.0",
            exportedAt: new Date().toISOString(),
            businessSettings: {
              name: businessName,
              tagline,
              phone,
              address,
              fssaiNumber,
              logo: businessLogo,
              currencySymbol,
              currencyCode,
              isGstEnabled,
              gstRate,
              gstinNumber,
              isServiceChargeEnabled,
              serviceChargeRate,
              isRoundOffEnabled,
              defaultPaymentMethod,
              paperWidth,
              receiptHeaderMessage,
              receiptFooterMessage
            },
            menuItems,
            customers,
            bills
          };

          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
          const downloadAnchor = document.createElement("a");
          downloadAnchor.setAttribute("href", dataStr);
          downloadAnchor.setAttribute("download", `secret_vibez_pos_backup_${new Date().toISOString().slice(0, 10)}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();

          showToast("System database backup successfully downloaded!");
          return 100;
        }
        return prev + 25;
      });
    }, 180);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.businessSettings) {
            if (parsed.businessSettings.name) setBusinessName(parsed.businessSettings.name);
            if (parsed.businessSettings.tagline) setTagline(parsed.businessSettings.tagline);
            if (parsed.businessSettings.phone) setPhone(parsed.businessSettings.phone);
            if (parsed.businessSettings.address) setAddress(parsed.businessSettings.address);
            if (parsed.businessSettings.logo) setBusinessLogo(parsed.businessSettings.logo);
            if (parsed.businessSettings.gstRate !== undefined) setGstRate(parsed.businessSettings.gstRate);
            if (parsed.businessSettings.isGstEnabled !== undefined) setIsGstEnabled(parsed.businessSettings.isGstEnabled);
          }

          if (onRestoreData) {
            onRestoreData({
              businessName: parsed.businessSettings?.name,
              businessLogo: parsed.businessSettings?.logo,
              gstRate: parsed.businessSettings?.gstRate,
              isGstEnabled: parsed.businessSettings?.isGstEnabled,
              menuItems: parsed.menuItems,
              customers: parsed.customers,
              bills: parsed.bills,
              staff: parsed.staff
            });
          }

          showToast("Database and settings restored from file!");
        } catch (err) {
          showToast("Failed to parse backup file. Please select a valid JSON backup.");
        }
      };
    }
  };

  // Reset handler
  const handleConfirmReset = () => {
    if (onResetTransactions) {
      onResetTransactions();
    }
    setShowResetConfirmModal(false);
    showToast("Transactions reset to initial baseline.");
  };

  // Preset GST buttons
  const gstPresets = [5, 12, 18, 28];

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E8872A]/10 text-[#E8872A]">
              <SlidersHorizontal size={20} />
            </span>
            <h1 className="text-lg font-black tracking-tight text-stone-900 font-display uppercase">
              Terminal Desk Settings
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-medium">
            Configure store profile, GST slabs, thermal receipts, staff accounts, and system backups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Synchronized</span>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1C1C1E] text-white px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={16} className="text-[#E8872A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-200/60 rounded-2xl border border-stone-200/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "profile"
              ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          }`}
        >
          <Building2 size={15} className={activeTab === "profile" ? "text-[#E8872A]" : "text-stone-400"} />
          <span>Store Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "billing"
              ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          }`}
        >
          <Percent size={15} className={activeTab === "billing" ? "text-[#E8872A]" : "text-stone-400"} />
          <span>Billing &amp; Tax</span>
        </button>

        <button
          onClick={() => setActiveTab("receipt")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "receipt"
              ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          }`}
        >
          <Printer size={15} className={activeTab === "receipt" ? "text-[#E8872A]" : "text-stone-400"} />
          <span>Receipt &amp; Print</span>
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "backup"
              ? "bg-white text-stone-900 shadow-xs border border-stone-250"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          }`}
        >
          <Database size={15} className={activeTab === "backup" ? "text-[#E8872A]" : "text-stone-400"} />
          <span>Data &amp; Backup</span>
        </button>

        {authUser?.role === "owner" && (
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-stone-900 shadow-xs border border-stone-250"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
            }`}
          >
            <Shield size={15} className={activeTab === "users" ? "text-[#E8872A]" : "text-stone-400"} />
            <span>User Accounts</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: STORE PROFILE */}
      {activeTab === "profile" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6 space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider font-display flex items-center gap-2">
                <Store size={18} className="text-[#E8872A]" />
                Brand Identity &amp; Location
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Customize your outlet name, branding logo, phone, address, and food license printed on customer receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Store / Restaurant Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#E8872A] focus:bg-white transition-all"
                  placeholder="Secret Vibez"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Sub-brand / Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#E8872A] focus:bg-white transition-all"
                  placeholder="Food & Stay"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Contact Phone / Helpline
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#E8872A] focus:bg-white transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* FSSAI License */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  FSSAI / Food License Number
                </label>
                <input
                  type="text"
                  value={fssaiNumber}
                  onChange={(e) => setFssaiNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#E8872A] focus:bg-white transition-all font-mono"
                  placeholder="11521019000452"
                />
              </div>

              {/* Outlet Physical Address */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Outlet Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#E8872A] focus:bg-white transition-all"
                  placeholder="Beach Road, Calangute, Goa 403516"
                />
              </div>

              {/* Logo preview & URL */}
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-stone-100">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Navbar Logo / Brand Emblem
                </label>
                <div className="flex items-center gap-4">
                  {businessLogo && (businessLogo.startsWith("/") || businessLogo.startsWith("http") || businessLogo.includes(".") || businessLogo.startsWith("data:")) ? (
                    <img 
                      src={businessLogo} 
                      alt="Logo preview" 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-cover rounded-2xl border border-stone-200 bg-stone-900 shadow-xs shrink-0" 
                    />
                  ) : (
                    <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-2xl border border-stone-200 shrink-0 font-bold">
                      {businessLogo || "✨"}
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      placeholder="Image URL or Emoji symbol (e.g. ✨ or /logo.jpg)"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#E8872A] focus:bg-white transition-all truncate"
                      value={businessLogo}
                      onChange={(e) => setBusinessLogo(e.target.value)}
                    />
                    <p className="text-[10px] text-stone-400">
                      Renders in the top left navbar, login portal, and header of printed thermal receipts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Currency & Format */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Currency Symbol
                </label>
                <div className="flex items-center gap-2">
                  {["₹", "$", "€", "£", "AED"].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setCurrencySymbol(sym)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        currencySymbol === sym
                          ? "bg-[#1C1C1E] text-white border-stone-900 shadow-xs"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Code */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Currency ISO Code
                </label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-[#E8872A] uppercase"
                  placeholder="INR"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => showToast("Store profile changes saved successfully!")}
                className="px-5 py-2.5 bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Save Store Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: BILLING & TAX */}
      {activeTab === "billing" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6 space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider font-display flex items-center gap-2">
                <Percent size={18} className="text-[#E8872A]" />
                Tax Rules &amp; Billing Calculation
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Configure Goods &amp; Services Tax (GST), tax slab percentages, and surcharge parameters for live orders.
              </p>
            </div>

            {/* GST Main Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-50 p-5 rounded-2xl border border-stone-200/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${
                    isGstEnabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                  }`}>
                    {isGstEnabled ? `GST TAX ACTIVE (${gstRate}%)` : "GST TAX DISABLED (0%)"}
                  </span>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed">
                  {isGstEnabled
                    ? `${gstRate}% GST tax is applied to customer order subtotals and itemized on invoices.`
                    : "GST tax calculation is turned OFF. Invoices and receipts will calculate 0% tax."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsGstEnabled(!isGstEnabled);
                  showToast(isGstEnabled ? "GST disabled" : `GST enabled at ${gstRate}%`);
                }}
                className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isGstEnabled ? 'bg-[#E8872A]' : 'bg-stone-300'
                }`}
                role="switch"
                aria-checked={isGstEnabled}
              >
                <span className="sr-only">Toggle GST tax</span>
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isGstEnabled ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* GST Details Configuration */}
            {isGstEnabled && (
              <div className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* GST Percentage Rate */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                      Tax Percentage Rate (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-28">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={gstRate}
                          onChange={(e) => setGstRate(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                          className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-extrabold text-stone-900 focus:outline-none focus:border-[#E8872A]"
                        />
                        <span className="absolute right-3 top-3 text-xs font-extrabold text-stone-400 pointer-events-none">%</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {gstPresets.map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setGstRate(rate)}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              gstRate === rate
                                ? "bg-[#1C1C1E] text-white border-stone-900 shadow-xs"
                                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-500">
                      Standard India F&amp;B GST Slab: 5% (Food &amp; Beverage standalone), 12% or 18% (Hotel composite).
                    </p>
                  </div>

                  {/* GSTIN Identification */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                      Business GSTIN Number
                    </label>
                    <input
                      type="text"
                      value={gstinNumber}
                      onChange={(e) => setGstinNumber(e.target.value.toUpperCase())}
                      placeholder="30AABCS1429B1Z8"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#E8872A] uppercase"
                    />
                    <p className="text-[10px] text-stone-500">
                      Printed on thermal invoice slip for tax compliances.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* Additional Billing Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Round-Off Toggle */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-900 text-xs">Auto Round-Off Total</span>
                  <p className="text-[11px] text-stone-500">Round final grand totals to the nearest whole integer ({currencySymbol}1.00).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoundOffEnabled(!isRoundOffEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isRoundOffEnabled ? "bg-[#E8872A]" : "bg-stone-200"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform transform shadow-xs ${
                      isRoundOffEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Service Charge */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-900 text-xs">Service Charge (Dine-in)</span>
                  <p className="text-[11px] text-stone-500">Optional 5% staff service gratuity calculation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsServiceChargeEnabled(!isServiceChargeEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isServiceChargeEnabled ? "bg-[#E8872A]" : "bg-stone-200"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform transform shadow-xs ${
                      isServiceChargeEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Default Payment Mode */}
              <div className="md:col-span-2 p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Default POS Settlement Method
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {["UPI / QR", "Cash", "Card / POS Terminal", "Split Payment"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDefaultPaymentMethod(mode)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        defaultPaymentMethod === mode
                          ? "bg-[#1C1C1E] text-white border-stone-900 shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => showToast("Billing and tax settings saved!")}
                className="px-5 py-2.5 bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Save Tax Configuration
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 3: RECEIPT & PRINTING */}
      {activeTab === "receipt" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          
          {/* Controls */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6 space-y-5">
              <div className="border-b border-stone-100 pb-4">
                <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider font-display flex items-center gap-2">
                  <Printer size={18} className="text-[#E8872A]" />
                  Thermal Printer &amp; Slip Format
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Adjust thermal paper dimensions, header greetings, footer slogans, and automatic printing behaviors.
                </p>
              </div>

              {/* Thermal Paper Width Selection */}
              <div className="space-y-2 text-xs">
                <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                  Thermal Paper Width
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaperWidth("80mm")}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paperWidth === "80mm"
                        ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                        : "bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <div className="font-extrabold text-xs">80mm Standard POS</div>
                    <div className={`text-[10px] mt-0.5 ${paperWidth === "80mm" ? "text-stone-300" : "text-stone-500"}`}>
                      Standard thermal roll (Epson, TVS, Star)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaperWidth("58mm")}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paperWidth === "58mm"
                        ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                        : "bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <div className="font-extrabold text-xs">58mm Compact POS</div>
                    <div className={`text-[10px] mt-0.5 ${paperWidth === "58mm" ? "text-stone-300" : "text-stone-500"}`}>
                      Handheld bluetooth mini printers
                    </div>
                  </button>
                </div>
              </div>

              {/* Receipt Header Message */}
              <div className="space-y-1.5 text-xs">
                <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                  Welcome Greeting (Header)
                </label>
                <input
                  type="text"
                  value={receiptHeaderMessage}
                  onChange={(e) => setReceiptHeaderMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#E8872A] focus:bg-white"
                  placeholder="Welcome to Secret Vibez • Food & Stay"
                />
              </div>

              {/* Receipt Footer Message */}
              <div className="space-y-1.5 text-xs">
                <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                  Closing Slogan (Footer)
                </label>
                <textarea
                  rows={2}
                  value={receiptFooterMessage}
                  onChange={(e) => setReceiptFooterMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#E8872A] focus:bg-white resize-none"
                  placeholder="Thank you for dining with us! Follow us @secretvibez"
                />
              </div>

              {/* Additional Checkbox Toggles */}
              <div className="space-y-3 pt-2 border-t border-stone-100 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPrintKOT}
                    onChange={(e) => setAutoPrintKOT(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E8872A] focus:ring-[#E8872A] border-stone-300"
                  />
                  <span className="font-semibold text-stone-800">
                    Automatically print Kitchen Order Ticket (KOT) on bill generation
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTaxBreakupOnReceipt}
                    onChange={(e) => setShowTaxBreakupOnReceipt(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E8872A] focus:ring-[#E8872A] border-stone-300"
                  />
                  <span className="font-semibold text-stone-800">
                    Show detailed GST tax summary breakdown (CGST + SGST) on customer slip
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFssaiOnReceipt}
                    onChange={(e) => setShowFssaiOnReceipt(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E8872A] focus:ring-[#E8872A] border-stone-300"
                  />
                  <span className="font-semibold text-stone-800">
                    Print FSSAI food license number in footer
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => showToast("Receipt preferences updated!")}
                  className="px-5 py-2.5 bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Save Receipt Settings
                </button>
              </div>
            </div>
          </div>

          {/* Live Receipt Paper Preview */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={13} />
                Live Thermal Slip Preview ({paperWidth})
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Simulated Paper</span>
            </div>

            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-300/80 shadow-md font-mono text-[11px] text-stone-800 space-y-3 select-text">
              {/* Slip Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-stone-300 pb-2.5">
                <div className="font-extrabold text-sm uppercase tracking-tight text-stone-950">{businessName}</div>
                <div className="text-[10px] text-stone-600 uppercase tracking-wider">{tagline}</div>
                <div className="text-[9px] text-stone-500">{address}</div>
                <div className="text-[9px] text-stone-500">Ph: {phone}</div>
                {showFssaiOnReceipt && fssaiNumber && (
                  <div className="text-[9px] text-stone-500 font-bold">FSSAI: {fssaiNumber}</div>
                )}
                {isGstEnabled && gstinNumber && (
                  <div className="text-[9px] text-stone-500 font-bold">GSTIN: {gstinNumber}</div>
                )}
                <div className="text-[9px] italic text-stone-600 mt-1">{receiptHeaderMessage}</div>
              </div>

              {/* Slip Metadata */}
              <div className="text-[10px] space-y-0.5 border-b border-dashed border-stone-300 pb-2">
                <div className="flex justify-between">
                  <span>Bill No: <strong>BILL-0188</strong></span>
                  <span>Table: <strong>T-04</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>Date: <strong>2026-05-22</strong></span>
                  <span>Time: <strong>08:45 PM</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>Cust: <strong>Walk-in Guest</strong></span>
                  <span>Cashier: <strong>Admin</strong></span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1 border-b border-dashed border-stone-300 pb-2 text-[10px]">
                <div className="flex justify-between font-bold text-stone-900 border-b border-stone-200 pb-1">
                  <span>Item</span>
                  <span className="w-12 text-center">Qty</span>
                  <span className="w-16 text-right">Amt ({currencySymbol})</span>
                </div>

                <div className="flex justify-between">
                  <span className="truncate max-w-[120px]">Paneer Butter Masala</span>
                  <span className="w-12 text-center">1</span>
                  <span className="w-16 text-right">240.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="truncate max-w-[120px]">Butter Garlic Naan</span>
                  <span className="w-12 text-center">3</span>
                  <span className="w-16 text-right">135.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="truncate max-w-[120px]">Sweet Mango Lassi</span>
                  <span className="w-12 text-center">2</span>
                  <span className="w-16 text-right">160.00</span>
                </div>
              </div>

              {/* Totals Calculation */}
              <div className="space-y-1 text-[10px] border-b border-dashed border-stone-300 pb-2.5">
                <div className="flex justify-between">
                  <span>Sub Total:</span>
                  <span>{currencySymbol}535.00</span>
                </div>

                {isGstEnabled && (
                  <>
                    {showTaxBreakupOnReceipt ? (
                      <>
                        <div className="flex justify-between text-stone-600">
                          <span>CGST ({(gstRate / 2).toFixed(1)}%):</span>
                          <span>{currencySymbol}{((535 * gstRate / 200)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>SGST ({(gstRate / 2).toFixed(1)}%):</span>
                          <span>{currencySymbol}{((535 * gstRate / 200)).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-stone-600">
                        <span>GST ({gstRate}%):</span>
                        <span>{currencySymbol}{((535 * gstRate / 100)).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                {isServiceChargeEnabled && (
                  <div className="flex justify-between text-stone-600">
                    <span>Service Charge (5%):</span>
                    <span>{currencySymbol}26.75</span>
                  </div>
                )}

                <div className="flex justify-between font-extrabold text-xs text-stone-950 pt-1 border-t border-stone-200">
                  <span>GRAND TOTAL:</span>
                  <span>{currencySymbol}{isGstEnabled ? Math.round(535 * (1 + gstRate / 100)).toFixed(2) : "535.00"}</span>
                </div>
                <div className="flex justify-between text-[9px] text-stone-500">
                  <span>Settlement Mode:</span>
                  <span className="font-bold uppercase">{defaultPaymentMethod}</span>
                </div>
              </div>

              {/* Slip Footer */}
              <div className="text-center space-y-1 text-[9px] text-stone-600 pt-1">
                <p className="leading-tight">{receiptFooterMessage}</p>
                <p className="font-mono text-stone-400">*** THANK YOU ***</p>
              </div>
            </div>
          </div>

        </div>
      )}



      {/* TAB CONTENT 5: SYSTEM & BACKUP */}
      {activeTab === "backup" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6 space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider font-display flex items-center gap-2">
                <Database size={18} className="text-[#E8872A]" />
                System Diagnostics &amp; Data Maintenance
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Export offline snapshots, restore catalog databases, or reset demonstration transaction logs.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1">
                <div className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Catalog Items</div>
                <div className="text-2xl font-black text-stone-900 font-display">{menuItems.length}</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1">
                <div className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Total Bills</div>
                <div className="text-2xl font-black text-stone-900 font-display">{bills.length}</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1">
                <div className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">CRM Records</div>
                <div className="text-2xl font-black text-stone-900 font-display">{customers.length}</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1">
                <div className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Terminal Build</div>
                <div className="text-2xl font-black text-[#E8872A] font-display">v2.4.0</div>
              </div>
            </div>

            {/* Backup / Export / Import Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* Export Card */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-white space-y-3">
                <div className="flex items-center gap-2 font-black text-stone-900 uppercase tracking-wide">
                  <Download size={16} className="text-[#E8872A]" />
                  <span>Export Offline JSON Backup</span>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Download a complete backup archive containing your menu catalog, bills, CRM records, tax parameters, and store configurations.
                </p>
                <div className="text-[10px] text-stone-400">
                  Last backup state: <strong className="text-stone-700 font-mono">{backupTimeString}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isBackupInProgress}
                  className="w-full mt-2 py-2.5 px-4 bg-[#1C1C1E] hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isBackupInProgress ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Packaging ({backupProgressPercent}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Download JSON Backup</span>
                    </>
                  )}
                </button>
              </div>

              {/* Import Card */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-white space-y-3">
                <div className="flex items-center gap-2 font-black text-stone-900 uppercase tracking-wide">
                  <Upload size={16} className="text-emerald-600" />
                  <span>Restore from JSON File</span>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Upload an existing Secret Vibez JSON database backup to instantly sync and restore all terminal assets.
                </p>
                
                <label className="w-full mt-2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-300/80 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload size={14} />
                  <span>Choose Backup File (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

            </div>

            {/* Reset Danger Zone */}
            <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-900 font-black uppercase tracking-wider">
                  <AlertTriangle size={16} className="text-rose-600" />
                  <span>Reset Demonstration Transactions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Reset Demo Data
                </button>
              </div>
              <p className="text-rose-700 text-[11px] leading-relaxed">
                Clears recent test orders and resets invoice counters back to factory seed dataset. Store branding and catalog remain intact.
              </p>
            </div>

          </div>

        </div>
      )}

      {activeTab === "users" && authUser?.role === "owner" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-6 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider font-display flex items-center gap-2">
                  <Shield size={18} className="text-[#E8872A]" />
                  User Accounts Management
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Manage login credentials, role scopes, password resets, and activation flags.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserName("");
                  setUserEmail("");
                  setUserPassword("");
                  setUserConfirmPassword("");
                  setUserRole("CASHIER");
                  setUserActive(true);
                  setShowCreateModal(true);
                }}
                className="px-4.5 py-2.5 bg-[#E8872A] hover:bg-[#d47820] text-stone-955 font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Create User</span>
              </button>
            </div>

            {/* Search Input bar */}
            <div className="relative max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E8872A]"
              />
            </div>

            {/* Desktop Table View (md:block) */}
            <div className="hidden md:block overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200 tracking-wider">
                    <th className="py-4.5 px-5">User Details</th>
                    <th className="py-4.5 px-5">System Role</th>
                    <th className="py-4.5 px-5">Account Status</th>
                    <th className="py-4.5 px-5">Registered Date</th>
                    <th className="py-4.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150 text-xs text-stone-850 font-semibold bg-white">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === authUser.id;
                    return (
                      <tr key={u.id} className="hover:bg-stone-50/50">
                        <td className="py-4 px-5">
                          <div className="font-extrabold text-stone-900">{u.name} {isSelf && <span className="text-[10px] text-stone-400 font-normal italic">(You)</span>}</div>
                          <div className="text-[10px] text-stone-500 font-medium mt-0.5">{u.email}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            u.role === "owner" ? "bg-amber-100 text-amber-800" :
                            u.role === "cashier" ? "bg-blue-100 text-blue-800" :
                            u.role === "waiter" ? "bg-emerald-100 text-emerald-800" :
                            "bg-purple-100 text-purple-800"
                          }`}>
                            {u.displayRoleName}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1 text-[11px] ${
                            u.active ? "text-emerald-700" : "text-stone-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-emerald-600" : "bg-stone-400"}`} />
                            {u.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono text-[10px] text-stone-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            Edit
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleStatusClick(u)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                                u.active 
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-700"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {u.active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                          <button
                            onClick={() => handleResetPassClick(u)}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            Reset Password
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-[10px] cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400 font-bold">
                        No user accounts matched search constraints.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="block md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredUsers.map((u) => {
                const isSelf = u.id === authUser.id;
                return (
                  <div key={u.id} className="bg-stone-50 border border-stone-250 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-stone-900">{u.name} {isSelf && <span className="text-[10px] text-stone-400 font-normal italic">(You)</span>}</h4>
                        <p className="text-[10px] text-stone-500 mt-0.5">{u.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        u.role === "owner" ? "bg-amber-100 text-amber-800" :
                        u.role === "cashier" ? "bg-blue-100 text-blue-800" :
                        u.role === "waiter" ? "bg-emerald-100 text-emerald-800" :
                        "bg-purple-100 text-purple-800"
                      }`}>
                        {u.displayRoleName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-stone-500 pt-2 border-t border-stone-200/60">
                      <span className="font-mono">{new Date(u.createdAt).toLocaleDateString()}</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        u.active ? "text-emerald-700" : "text-stone-400"
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${u.active ? "bg-emerald-600" : "bg-stone-400"}`} />
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-center text-[10px] cursor-pointer"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => handleResetPassClick(u)}
                        className="py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-center text-[10px] cursor-pointer"
                      >
                        Reset Password
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => handleToggleStatusClick(u)}
                          className={`py-2 rounded-xl font-bold text-center text-[10px] cursor-pointer ${
                            u.active 
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {u.active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteClick(u)}
                          className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-center text-[10px] cursor-pointer"
                        >
                          Delete User
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-stone-900 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <UserPlus size={18} className="text-[#E8872A]" />
              <h3 className="text-sm font-black tracking-tight">Create Employee Account</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs placeholder-stone-400 outline-none focus:border-[#E8872A]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs placeholder-stone-400 outline-none focus:border-[#E8872A]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">Access Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-none focus:border-[#E8872A] font-bold"
                >
                  <option value="CASHIER">Cashier</option>
                  <option value="WAITER">Waiter</option>
                  <option value="CHEF">Chef</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">Initial Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs placeholder-stone-400 outline-none focus:border-[#E8872A]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={userConfirmPassword}
                  onChange={(e) => setUserConfirmPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs placeholder-stone-400 outline-none focus:border-[#E8872A]"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="font-bold">Account Active</span>
                <input
                  type="checkbox"
                  checked={userActive}
                  onChange={(e) => setUserActive(e.target.checked)}
                  className="w-4 h-4 accent-[#E8872A] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createUserMutation.isPending}
                onClick={() => {
                  if (!userName || !userEmail || !userPassword || !userConfirmPassword) {
                    showToast("Please fill all fields.");
                    return;
                  }
                  if (userPassword.length < 6) {
                    showToast("Password must be at least 6 characters.");
                    return;
                  }
                  if (userPassword !== userConfirmPassword) {
                    showToast("Passwords do not match.");
                    return;
                  }
                  createUserMutation.mutate({
                    name: userName,
                    email: userEmail,
                    role: userRole,
                    password: userPassword,
                    confirmPassword: userConfirmPassword,
                    active: userActive
                  });
                }}
                className="w-1/2 py-2.5 text-xs font-bold text-[#1C1C1E] bg-[#E8872A] hover:bg-[#d47820] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-stone-900 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Edit size={18} className="text-[#E8872A]" />
              <h3 className="text-sm font-black tracking-tight">Edit Employee Account</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs placeholder-stone-400 outline-none focus:border-[#E8872A]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs placeholder-stone-400 outline-none focus:border-[#E8872A]"
                />
              </div>

              {selectedUser.role !== "owner" && (
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-stone-500">Access Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-none focus:border-[#E8872A] font-bold"
                  >
                    <option value="CASHIER">Cashier</option>
                    <option value="WAITER">Waiter</option>
                    <option value="CHEF">Chef</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateUserMutation.isPending}
                onClick={() => {
                  if (!userName || !userEmail) {
                    showToast("Please fill name and email.");
                    return;
                  }
                  updateUserMutation.mutate({
                    id: selectedUser.id,
                    data: {
                      name: userName,
                      email: userEmail,
                      role: selectedUser.role === "owner" ? undefined : userRole
                    }
                  });
                }}
                className="w-1/2 py-2.5 text-xs font-bold text-[#1C1C1E] bg-[#E8872A] hover:bg-[#d47820] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetPassModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-stone-900 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Lock size={18} className="text-[#E8872A]" />
              <h3 className="text-sm font-black tracking-tight">Reset Password</h3>
            </div>

            <p className="text-[11px] text-stone-500">
              Reset login password for: <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={resetPass}
                  onChange={(e) => setResetPass(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-none focus:border-[#E8872A]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={resetPassConfirm}
                  onChange={(e) => setResetPassConfirm(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-none focus:border-[#E8872A]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetPassModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetUserPasswordMutation.isPending}
                onClick={() => {
                  if (resetPass.length < 6) {
                    showToast("Password must be at least 6 characters.");
                    return;
                  }
                  if (resetPass !== resetPassConfirm) {
                    showToast("Passwords do not match.");
                    return;
                  }
                  resetUserPasswordMutation.mutate({
                    id: selectedUser.id,
                    data: {
                      password: resetPass,
                      confirmPassword: resetPassConfirm
                    }
                  });
                }}
                className="w-1/2 py-2.5 text-xs font-bold text-[#1C1C1E] bg-[#E8872A] hover:bg-[#d47820] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-stone-900 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 border-b border-stone-100 pb-3">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-black tracking-tight text-stone-900">Delete this user?</h3>
            </div>

            <p className="text-xs text-stone-650 leading-relaxed">
              Are you sure you want to permanently remove user account: <strong>{selectedUser.name}</strong> ({selectedUser.email})?
              <br />
              <span className="text-[10px] text-stone-400 block mt-2 text-stone-450">
                *Note: If the user has order or checkout transaction logs, the account will be deactivated instead to protect audit logs.
              </span>
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteUserMutation.isPending}
                onClick={() => deleteUserMutation.mutate(selectedUser.id)}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-stone-900 space-y-5">
            <div className="flex items-center gap-2.5 text-rose-600 border-b border-stone-100 pb-3">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-black tracking-tight text-stone-900">Reset Demo Data?</h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to reset demo orders and transactions to factory defaults? This action will reload sample bills.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
