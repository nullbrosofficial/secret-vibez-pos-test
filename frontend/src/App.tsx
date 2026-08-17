import React, { useState, useEffect } from "react";
import { PageId, UserRole, MenuItem, Customer, Bill, StaffAccount, AuthUser } from "./types";
import { 
  INITIAL_CATEGORIES, 
  INITIAL_MENU_ITEMS, 
  INITIAL_CUSTOMERS, 
  INITIAL_BILLS, 
  INITIAL_STAFF 
} from "./mockData";
import { getStoredUser, clearStoredUser, isPageAllowed } from "./authData";
import { clearAccessToken, menuApi, customerApi, orderApi, settingsApi, categoryApi, getSocketConnection, disconnectSocket } from "./api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Views
import LoginView from "./components/LoginView";
import UnauthorizedView from "./components/UnauthorizedView";
import BillingView from "./components/BillingView";
import OrdersView from "./components/OrdersView";
import KitchenView from "./components/KitchenView";
import MenuView from "./components/MenuView";
import CustomersView from "./components/CustomersView";
import SalesView from "./components/SalesView";
import SettingsView from "./components/SettingsView";

// Icons
import { 
  Receipt, ChefHat, Users, BarChart3, 
  Settings, UserCircle, LogOut, Utensils, BookOpen, Download, AlertTriangle, Menu
} from "lucide-react";

import secretVibezLogo from "./assets/images/secret_vibez_logo.jpg";

export default function App() {
  // Mock Auth Session State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredUser());

  // Navigation & Security Role states
  const [activePage, setActivePage] = useState<PageId>(() => {
    const user = getStoredUser();
    return user ? user.defaultPage : "billing";
  });

  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Synchronize location hash for URL testing (e.g. #billing, #kitchen, #dashboard, #reports)
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace("#", "").toLowerCase().trim();
      if (rawHash) {
        let page: PageId = rawHash as PageId;
        if (rawHash === "dashboard") page = "billing";
        if (rawHash === "reports") page = "sales";
        setActivePage(page);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    }
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync hash when active page changes
  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    window.location.hash = page;
    setIsSidebarOpen(false);
  };

  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Monitor network connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const socket = getSocketConnection();
      if (authUser) {
        socket.connect();
        queryClient.invalidateQueries();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      disconnectSocket();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [authUser, queryClient]);

  // Handle custom install prompt trigger
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Socket.IO event listeners for real-time state synchronization
  useEffect(() => {
    if (!authUser || !isOnline) {
      disconnectSocket();
      return;
    }

    const socket = getSocketConnection();

    socket.on("connect", () => {
      console.log("Connected to Socket.IO backend");
    });

    socket.on("menu.updated", () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    });

    socket.on("settings.updated", () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    });

    socket.on("table.status_changed", () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
    });

    socket.on("order.created", () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
    });

    socket.on("order.status_changed", () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
    });

    socket.on("payment.completed", () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
    });

    socket.on("bill.requested", () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
    });

    return () => {
      socket.off("menu.updated");
      socket.off("settings.updated");
      socket.off("table.status_changed");
      socket.off("order.created");
      socket.off("order.status_changed");
      socket.off("payment.completed");
      socket.off("bill.requested");
    };
  }, [authUser, isOnline, queryClient]);

  // Queries
  const { data: menuItemsData } = useQuery({
    queryKey: ["menuItems"],
    queryFn: menuApi.list,
    enabled: !!authUser
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.list,
    enabled: !!authUser
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerApi.list(),
    enabled: !!authUser
  });

  const { data: ordersData } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderApi.list(),
    enabled: !!authUser
  });



  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
    enabled: !!authUser
  });

  // Map variables
  const menuItems = menuItemsData || [];
  const categoriesList = categoriesData ? categoriesData.map(c => c.name) : INITIAL_CATEGORIES;
  const customers = customersData || [];
  const isWhatsAppConnected = true; // Simple live diagnostic placeholder

  const isGstEnabled = settingsData?.isGstEnabled ?? true;
  const gstRate = settingsData?.gstRate ?? 5;
  const businessName = settingsData?.restaurantName || "Secret Vibez";
  const businessLogo = secretVibezLogo;

  // Map order database list to Bill structure
  const bills = (ordersData || []).map((order: any) => ({
    billNo: order.orderNo,
    customerName: order.customer ? order.customer.name : "Walk-in Customer",
    customerWhatsapp: order.customer ? order.customer.whatsapp : undefined,
    items: order.items.map((i: any) => ({
      itemId: i.menuItemId,
      itemName: i.itemName,
      price: i.price,
      quantity: i.quantity
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    grandTotal: order.grandTotal,
    date: order.date,
    timestamp: order.timestamp,
    status: (order.status === "COMPLETED" ? "Saved" : "Pending") as "Saved" | "Pending"
  }));

  // Settings Mutation Helper
  const settingsMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] })
  });

  const updateSettingField = (updates: any) => {
    if (!settingsData) return;
    settingsMutation.mutate({
      restaurantName: settingsData.restaurantName,
      address: settingsData.address,
      phone: settingsData.phone,
      gstNumber: settingsData.gstNumber,
      isGstEnabled: settingsData.isGstEnabled,
      gstRate: settingsData.gstRate,
      currency: settingsData.currency,
      receiptHeader: settingsData.receiptHeader,
      receiptFooter: settingsData.receiptFooter,
      ...updates
    });
  };

  const setBusinessName = (name: string) => updateSettingField({ restaurantName: name });
  const setBusinessLogo = (logo: string) => {}; // logo is static asset
  const setIsGstEnabled = (enabled: boolean) => updateSettingField({ isGstEnabled: enabled });
  const setGstRate = (rate: number) => updateSettingField({ gstRate: rate });

  // Menu Mutations
  const addMenuMutation = useMutation({
    mutationFn: (item: Partial<MenuItem>) => menuApi.create(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menuItems"] })
  });

  const updateMenuMutation = useMutation({
    mutationFn: (item: MenuItem) => menuApi.update(item.id, item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menuItems"] })
  });

  const deleteMenuMutation = useMutation({
    mutationFn: menuApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menuItems"] })
  });

  const handleAddMenuItem = (item: any) => addMenuMutation.mutate(item);
  const handleUpdateMenuItem = (item: any) => updateMenuMutation.mutate(item);
  const handleDeleteMenuItem = (id: number) => deleteMenuMutation.mutate(id);



  // Customer Mutation
  const addCustomerMutation = useMutation({
    mutationFn: (cust: Partial<Customer>) => customerApi.create(cust),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] })
  });

  const handleAddCustomer = (cust: any) => addCustomerMutation.mutate(cust);

  // Bill Mutation
  const handleAddBill = (newBill: any) => {
    // In our live setup checkout is initiated directly in BillingView
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  const handleRestoreData = (data: any) => {};
  const handleResetTransactions = () => {};

  // Login handler
  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    handleNavigate(user.defaultPage);
  };

  // Logout handler
  const handleLogout = () => {
    clearStoredUser();
    clearAccessToken();
    setAuthUser(null);
    setShowLogoutModal(false);
    window.location.hash = "";
  };

  // If user is not authenticated, render Login Page
  if (!authUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        businessName={businessName}
        businessLogo={businessLogo}
      />
    );
  }

  // Navigation link list depending on active role security layer
  const navigationLinks = [
    { id: "billing", label: "Live Billing POS", icon: Receipt },
    { id: "orders", label: "Order Taking", icon: Utensils },
    { id: "kitchen", label: "Kitchen Display (KDS)", icon: ChefHat },
    { id: "menu", label: "Menu Management", icon: BookOpen },
    { id: "customers", label: "Customer Database", icon: Users },
    { id: "sales", label: "Sales & Reports", icon: BarChart3 },
    { id: "settings", label: "Desk Settings", icon: Settings }
  ];

  // Filter links allowed for the logged in user
  const allowedLinks = navigationLinks.filter(lnk =>
    authUser.role === "owner" || authUser.allowedPages.includes(lnk.id as PageId)
  );

  // Role Protection check
  const isCurrentPageAllowed = isPageAllowed(authUser, activePage);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF7F2] font-sans antialiased text-stone-900 relative">
      
      {/* Background overlay drawer backdrop on small screens */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* 1. COLLAPSIBLE LEFT DRAWER SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[#1C1C1E] text-stone-300 flex flex-col justify-between shrink-0 select-none shadow-xl border-r border-stone-800 transition-transform duration-300 transform lg:static lg:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        
        {/* Top business header */}
        <div className="p-4 border-b border-stone-800/80">
          <div className="flex items-center gap-3">
            {businessLogo && (businessLogo.startsWith("/") || businessLogo.startsWith("http") || businessLogo.includes(".") || businessLogo.startsWith("data:")) ? (
              <img 
                src={businessLogo} 
                alt={`${businessName} Logo`}
                referrerPolicy="no-referrer"
                className="w-11 h-11 object-cover rounded-xl border border-stone-700/80 bg-stone-900 shadow-xs shrink-0" 
              />
            ) : (
              <span className="text-2xl p-1.5 bg-stone-800/60 rounded-xl flex items-center justify-center w-11 h-11 shrink-0" title={`${businessName} Logo`}>
                {businessLogo}
              </span>
            )}
            <div className="truncate leading-tight">
              <h1 className="text-sm font-black font-display tracking-tight text-white uppercase">{businessName}</h1>
              <p className="text-[10px] text-[#E8872A] font-semibold tracking-wider uppercase">Food &amp; Stay</p>
            </div>
          </div>
        </div>

        {/* Middleware navigation loops */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allowedLinks.map(link => {
            const IconComponent = link.icon;
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavigate(link.id as PageId)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs font-semibold rounded-xl tracking-tight transition-all text-left cursor-pointer ${
                  isActive 
                    ? "bg-[#E8872A] text-stone-950 font-bold shadow-xs" 
                    : "text-stone-400 hover:text-white hover:bg-stone-800/50"
                }`}
              >
                <IconComponent size={14} className={isActive ? "text-stone-950" : "text-stone-400"} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {showInstallBtn && (
          <div className="mx-4 mb-4 p-3.5 bg-stone-900 border border-stone-850 rounded-xl text-center space-y-2">
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Install Web App</p>
            <button
              onClick={triggerInstall}
              className="w-full bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-extrabold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Download size={12} />
              <span>Install POS App</span>
            </button>
          </div>
        )}

        {/* Bottom User Profile & Logout Section */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-950/40 space-y-3">
          
          {/* User profile row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700/80 flex items-center justify-center shrink-0 text-stone-300 shadow-2xs">
              <UserCircle size={24} className="text-stone-300 stroke-[1.75]" />
            </div>
            <div className="truncate leading-tight">
              <h2 className="text-xs font-bold text-white tracking-tight truncate">
                {authUser.name}
              </h2>
              <p className="text-[11px] text-stone-400 font-medium tracking-wide mt-0.5">
                {authUser.displayRoleName}
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-3 text-stone-400 hover:text-white transition-colors text-xs font-semibold w-full text-left group py-1 cursor-pointer"
            >
              <div className="w-10 flex items-center justify-center shrink-0">
                <LogOut size={18} className="text-stone-400 group-hover:text-white transition-colors shrink-0" />
              </div>
              <span>Logout</span>
            </button>
          </div>

        </div>

      </aside>

      {/* 2. MAIN ACTIVE PAGE CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {!isOnline && (
          <div className="bg-rose-600 text-white text-[11px] font-black p-2.5 flex items-center justify-center gap-2 animate-in fade-in select-none">
            <AlertTriangle size={14} className="animate-bounce" />
            <span>OFFLINE TERMINAL • Submissions &amp; payment settlements are locked until connection is restored.</span>
          </div>
        )}

        {/* Dynamic Nav Header Bar (including Mobile Hamburger menu button) */}
        <header className="h-14 bg-white border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-50 cursor-pointer flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
            >
              <Menu size={20} />
            </button>
            <span className="text-stone-400 font-bold font-display text-xs tracking-wider uppercase hidden sm:inline">Terminal View</span>
            <span className="text-stone-300 hidden sm:inline">/</span>
            <span className="text-stone-900 text-xs font-extrabold tracking-tight capitalize">
              {activePage.replace("-", " ")} Workspace
            </span>
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-6xl mx-auto h-full">
            
            {!isCurrentPageAllowed ? (
              <UnauthorizedView
                user={authUser}
                attemptedPage={activePage}
                onNavigateToDefault={() => handleNavigate(authUser.defaultPage)}
              />
            ) : (
              <>
                {activePage === "billing" && (
                  <BillingView 
                    menuItems={menuItems}
                    customers={customers}
                    bills={bills}
                    onAddBill={handleAddBill}
                    onAddCustomer={handleAddCustomer}
                    isWhatsAppConnected={isWhatsAppConnected}
                    isGstEnabled={isGstEnabled}
                    gstRate={gstRate}
                    businessName={businessName}
                    businessLogo={businessLogo}
                    isOnline={isOnline}
                  />
                )}

                {activePage === "orders" && (
                  <OrdersView menuItems={menuItems} isOnline={isOnline} />
                )}

                {activePage === "kitchen" && (
                  <KitchenView isOnline={isOnline} />
                )}

                {activePage === "menu" && (
                  <MenuView 
                    menuItems={menuItems}
                    categories={categoriesList}
                    onAddMenuItem={handleAddMenuItem}
                    onUpdateMenuItem={handleUpdateMenuItem}
                    onDeleteMenuItem={handleDeleteMenuItem}
                  />
                )}

                {activePage === "customers" && (
                  <CustomersView 
                    customers={customers}
                    bills={bills}
                    onAddCustomer={handleAddCustomer}
                  />
                )}

                {activePage === "sales" && (
                  <SalesView 
                    bills={bills}
                  />
                )}

                {activePage === "settings" && (
                  <SettingsView 
                    authUser={authUser}
                    businessName={businessName}
                    setBusinessName={setBusinessName}
                    businessLogo={businessLogo}
                    setBusinessLogo={setBusinessLogo}
                    isGstEnabled={isGstEnabled}
                    setIsGstEnabled={setIsGstEnabled}
                    gstRate={gstRate}
                    setGstRate={setGstRate}
                    menuItems={menuItems}
                    customers={customers}
                    bills={bills}
                    onRestoreData={handleRestoreData}
                    onResetTransactions={handleResetTransactions}
                  />
                )}
              </>
            )}

          </div>
        </div>

      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-stone-900 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-stone-700" />
                <h3 className="text-sm font-extrabold tracking-tight text-stone-900">Sign Out</h3>
              </div>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to sign out of <strong className="text-stone-900">{authUser.name}</strong> ({authUser.displayRoleName})? Your current session will be cleared.
            </p>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


