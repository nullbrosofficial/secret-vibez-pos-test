import React, { useState, useMemo } from "react";
import { MenuItem, Customer, Bill, BillDetail } from "../types";
import { 
  Search, Check, Printer, Send, 
  CreditCard, Clock, CheckCircle2, AlertCircle, ShoppingBag, 
  Percent, Building2, UserCircle, RefreshCw, Eye
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billApi, orderApi, settingsApi } from "../api";

interface BillingViewProps {
  menuItems: MenuItem[];
  customers: Customer[];
  bills: Bill[];
  onAddBill: (newBill: Bill) => void;
  onAddCustomer: (newCust: Customer) => void;
  isWhatsAppConnected: boolean;
  isGstEnabled?: boolean;
  gstRate?: number;
  businessName?: string;
  businessLogo?: string;
  isOnline?: boolean;
}

export default function BillingView({
  menuItems,
  customers,
  bills,
  onAddBill,
  onAddCustomer,
  isWhatsAppConnected,
  isGstEnabled = true,
  gstRate = 5,
  businessName = "Secret Vibez",
  businessLogo = "✨",
  isOnline = true
}: BillingViewProps) {
  const queryClient = useQueryClient();

  // Queries
  const { data: queue = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["billsQueue"],
    queryFn: billApi.getQueue
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get
  });

  // State
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | "New" | "Processing" | "Paid" | "Completed">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI / QR" | "Card">("UPI");
  const [discount, setDiscount] = useState<number>(0);

  // Simulation modals
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Find currently selected order in queue
  const selectedOrder = useMemo(() => {
    if (selectedOrderId === null) return null;
    return queue.find(o => o.id === selectedOrderId) || null;
  }, [queue, selectedOrderId]);

  // Derive Bill structure for existing print/WhatsApp modals
  const lastSavedBill = useMemo<Bill | null>(() => {
    if (!selectedOrder) return null;
    return {
      billNo: selectedOrder.orderNo,
      customerName: selectedOrder.customer ? selectedOrder.customer.name : "Walk-in Customer",
      customerWhatsapp: selectedOrder.customer ? selectedOrder.customer.whatsapp : undefined,
      items: selectedOrder.items.map((i: any) => ({
        itemId: i.menuItemId,
        itemName: i.itemName,
        price: i.price,
        quantity: i.quantity
      })),
      subtotal: selectedOrder.subtotal,
      tax: selectedOrder.tax,
      grandTotal: selectedOrder.grandTotal,
      date: selectedOrder.date,
      timestamp: selectedOrder.timestamp,
      status: selectedOrder.status
    };
  }, [selectedOrder]);

  // Recalculations on the fly for client-side presentation
  const derivedSubtotal = selectedOrder ? selectedOrder.subtotal : 0;
  const derivedNetSubtotal = Math.max(0, derivedSubtotal - discount);
  const derivedTax = isGstEnabled ? Math.round((derivedNetSubtotal * gstRate) / 100) : 0;
  const derivedGrandTotal = Math.max(0, derivedNetSubtotal + derivedTax);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter(order => {
      // 1. Status Filter
      if (activeTab === "New" && order.status !== "BILL_REQUESTED") return false;
      if (activeTab === "Processing" && order.status !== "PROCESSING") return false;
      if (activeTab === "Paid" && order.status !== "PAID") return false;
      if (activeTab === "Completed" && order.status !== "COMPLETED") return false;

      // 2. Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTable = order.table?.tableNumber?.toLowerCase().includes(query);
        const matchesOrder = order.orderNo?.toLowerCase().includes(query);
        const matchesCust = order.customer?.name?.toLowerCase().includes(query);
        return matchesTable || matchesOrder || matchesCust;
      }

      return true;
    });
  }, [queue, activeTab, searchQuery]);

  // Click handler to open bill and automatically transition status to PROCESSING
  const handleSelectOrder = async (orderId: number, currentStatus: string) => {
    setErrorMessage(null);
    setSelectedOrderId(orderId);
    
    const matched = queue.find(o => o.id === orderId);
    setDiscount(matched?.discount || 0);

    if (currentStatus === "BILL_REQUESTED") {
      try {
        await orderApi.updateStatus(orderId, "PROCESSING");
        queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
      } catch (err: any) {
        showError(err.message || "Failed to transition bill to Processing status");
      }
    }
  };

  // Payment settle mutations
  const settlePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrderId) throw new Error("No active bill selected");
      return billApi.payment(selectedOrderId, { paymentMethod, discount });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      showToast(`Settled Payment for Order ${selectedOrder?.orderNo}!`);
      // Keep selected order active so receipt can be printed immediately after checkout
    },
    onError: (err: any) => {
      showError(err.message || "Failed to settle payment");
    }
  });

  // Complete Order & Release Table
  const completeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrderId) throw new Error("No active bill selected");
      return billApi.complete(selectedOrderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      showToast("Order completed successfully. Table released to CLEANING status.");
      setSelectedOrderId(null);
    },
    onError: (err: any) => {
      showError(err.message || "Failed to complete order");
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handlePrintBill = () => {
    if (!lastSavedBill) return;
    setShowReceiptModal(true);
  };

  const handleWhatsAppTrigger = () => {
    if (!lastSavedBill) return;
    setShowWhatsAppModal(true);
  };

  const confirmSendWhatsApp = () => {
    if (!lastSavedBill) return;
    setShowWhatsAppModal(false);
    showToast(`WhatsApp receipt shared with ${lastSavedBill.customerWhatsapp || "Customer"}!`);
  };

  const whatsAppMessageText = useMemo(() => {
    if (!lastSavedBill) return "";
    const itemsText = lastSavedBill.items
      .map(i => `• ${i.itemName} x ${i.quantity} = ₹${i.price * i.quantity}`)
      .join("\n");
    const gstText = lastSavedBill.tax > 0 ? `*GST (${gstRate}%):* ₹${lastSavedBill.tax}` : `*GST:* ₹0 (Disabled)`;
    return `*${businessName.toUpperCase()}* 🍴\n\nHello *${lastSavedBill.customerName}*,\nThank you for visiting us! Here is your bill summary:\n\n*Bill No:* ${lastSavedBill.billNo}\n*Date:* ${lastSavedBill.date} ${lastSavedBill.timestamp}\n\n*Items Ordered:*\n${itemsText}\n\n*Subtotal:* ₹${lastSavedBill.subtotal}\n${gstText}\n*Grand Total:* ₹${lastSavedBill.grandTotal}\n\nThank you! Visit us again soon.`;
  }, [lastSavedBill, gstRate, businessName]);

  return (
    <div className="space-y-6 select-none">
      
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-stone-200/80 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#E8872A]" />
            <span>Cashier Bill Queue &amp; Settlement Panel</span>
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Monitor restaurant orders requesting bills, process card/UPI/cash checkouts, and print receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="bg-stone-100 hover:bg-stone-200 disabled:opacity-85 text-stone-700 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-stone-200"
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          <span>{isFetching ? "Refreshing..." : "Refresh Queue"}</span>
        </button>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Bill Queue list (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters & Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by table, order no or customer name..."
                className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E8872A]"
              />
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["All", "New", "Processing", "Paid", "Completed"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4.5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab
                      ? "bg-[#E8872A] text-stone-950 shadow-2xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {tab === "New" ? "New Bills" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List Cards */}
          {isLoading ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 font-semibold text-xs">
              Loading bill queue...
            </div>
          ) : filteredQueue.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredQueue.map(order => {
                const isSelected = selectedOrderId === order.id;
                let statusBadge = "bg-stone-100 text-stone-700";
                if (order.status === "BILL_REQUESTED") {
                  statusBadge = "bg-rose-100 text-rose-800 border border-rose-350 animate-pulse font-extrabold";
                } else if (order.status === "PROCESSING") {
                  statusBadge = "bg-amber-100 text-amber-900 border border-amber-300";
                } else if (order.status === "PAID") {
                  statusBadge = "bg-emerald-100 text-emerald-900 border border-emerald-300";
                } else if (order.status === "COMPLETED") {
                  statusBadge = "bg-purple-100 text-purple-900 border border-purple-200";
                }

                return (
                  <div
                    key={order.id}
                    className={`bg-white border p-5 rounded-2xl flex flex-col justify-between transition-all space-y-4 shadow-2xs ${
                      isSelected ? "border-[#E8872A] ring-2 ring-[#E8872A]/10" : "border-stone-200/80"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-stone-900">
                          {order.table ? `Table ${order.table.tableNumber}` : "Walk-in Biller"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${statusBadge}`}>
                          {order.status === "BILL_REQUESTED" ? "Bill Requested" : order.status}
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 space-y-1">
                        <div>Order: <strong className="text-stone-800 font-mono">#{order.orderNo}</strong></div>
                        <div>Customer: <strong className="text-stone-800">{order.customer ? order.customer.name : "Walk-in"}</strong></div>
                        <div>Timestamp: <strong className="text-stone-800">{order.timestamp}</strong></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-stone-900">₹{order.grandTotal}</span>
                      
                      <button
                        type="button"
                        onClick={() => handleSelectOrder(order.id, order.status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-stone-900 text-white"
                            : "bg-[#E8872A] hover:bg-[#d47820] text-stone-950"
                        }`}
                      >
                        <Eye size={12} />
                        <span>View Bill</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500">
              <ShoppingBag className="mx-auto text-stone-300 mb-3" size={28} />
              <p className="text-xs font-semibold">No bills found in this queue tab.</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Pending checkouts from tables automatically populate here.</p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Bill Detail Panel (lg:col-span-1) */}
        <div className="bg-stone-900 text-white rounded-2xl flex flex-col shadow-xl overflow-hidden min-h-[450px]">
          
          {/* Header */}
          <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center gap-2">
            <Clock size={16} className="text-[#E8872A]" />
            <span className="font-bold font-display text-sm">Settlement Summary</span>
          </div>

          {!isOnline && (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-semibold p-3 m-4 rounded-xl flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              <span>Billing offline: Payment settlements are locked.</span>
            </div>
          )}

          {selectedOrder ? (
            <div className="flex-1 flex flex-col justify-between p-4 space-y-4">
              
              {/* Receipt Info details */}
              <div className="space-y-4">
                <div className="border-b border-stone-800 pb-3 text-xs text-stone-400 leading-tight space-y-1">
                  <div className="text-sm font-black text-white">{businessName} Invoice</div>
                  <div>Table: <strong className="text-white">{selectedOrder.table ? `Table ${selectedOrder.table.tableNumber}` : "Walk-in"}</strong></div>
                  <div>Order No: <strong className="text-white font-mono">#{selectedOrder.orderNo}</strong></div>
                  <div>Status: <strong className="text-[#E8872A] uppercase">{selectedOrder.status}</strong></div>
                </div>

                {/* Items loop */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs font-semibold py-1">
                      <div className="text-stone-300">
                        {item.itemName} <span className="text-stone-500 text-[10px]">x{item.quantity}</span>
                      </div>
                      <span className="font-mono text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown & Payment triggers */}
              <div className="border-t border-stone-800 pt-3 space-y-4">
                
                {/* Discount input box (Owner & Cashier authorised) */}
                {(selectedOrder.status === "BILL_REQUESTED" || selectedOrder.status === "PROCESSING") && (
                  <div className="space-y-1.5 bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      Apply Bill Discount (₹)
                    </label>
                    <div className="relative">
                      <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                      <input
                        type="number"
                        min="0"
                        max={derivedSubtotal}
                        value={discount === 0 ? "" : discount}
                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0.00"
                        className="w-full bg-[#18181A] border border-stone-700/80 rounded-xl py-2 pl-8 pr-4 text-xs font-bold text-white placeholder-stone-600 focus:outline-none focus:border-[#E8872A] transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="text-xs space-y-2 font-semibold">
                  <div className="flex justify-between text-stone-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">₹{derivedSubtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Discount applied:</span>
                      <span className="font-mono">-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-400">
                    <span>GST ({gstRate}%):</span>
                    <span className="font-mono text-white">₹{derivedTax}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-stone-800 pt-2 text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#E8872A] text-base">₹{derivedGrandTotal}</span>
                  </div>
                </div>

                {/* Payment method selector (Only show if not paid yet) */}
                {(selectedOrder.status === "BILL_REQUESTED" || selectedOrder.status === "PROCESSING") && (
                  <div className="space-y-2 pt-2">
                    <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">Select Settlement Method</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(["UPI / QR", "Cash", "Card"] as const).map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2 rounded-xl text-[10px] font-bold tracking-tight transition-all cursor-pointer border ${
                            paymentMethod === method
                              ? "bg-white text-stone-950 border-white shadow-xs"
                              : "bg-stone-800 text-stone-400 border-stone-700 hover:text-white"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA actions */}
                <div className="space-y-2 pt-2">
                  {/* Settle button */}
                  {(selectedOrder.status === "BILL_REQUESTED" || selectedOrder.status === "PROCESSING") ? (
                    <button
                      type="button"
                      disabled={settlePaymentMutation.isPending || !isOnline}
                      onClick={() => settlePaymentMutation.mutate()}
                      className="w-full bg-[#E8872A] hover:bg-[#d47820] active:scale-[0.99] text-stone-950 font-black py-3 rounded-xl text-xs transition-colors flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard size={13} />
                      <span>{settlePaymentMutation.isPending ? "Processing..." : `Settle & Pay Bill via ${paymentMethod}`}</span>
                    </button>
                  ) : selectedOrder.status === "PAID" ? (
                    <div className="space-y-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold p-3.5 rounded-xl flex items-center justify-between">
                        <span>Paid via: <strong>{selectedOrder.payment?.paymentMethod || "UPI / QR"}</strong></span>
                        <span className="font-bold text-white">₹{selectedOrder.grandTotal}</span>
                      </div>
                      <button
                        type="button"
                        disabled={completeOrderMutation.isPending}
                        onClick={() => completeOrderMutation.mutate()}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-black py-3 rounded-xl text-xs transition-colors flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} />
                        <span>{completeOrderMutation.isPending ? "Completing..." : "Complete & Release Table"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-stone-800 p-3.5 rounded-xl text-stone-400 text-center text-xs font-bold uppercase tracking-wider">
                      Order fully completed
                    </div>
                  )}

                  {/* Print and share buttons (Only available if bill exists) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handlePrintBill}
                      className="bg-stone-850 hover:bg-stone-800 text-white font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-1.5 border border-stone-800 cursor-pointer"
                    >
                      <Printer size={13} />
                      Print Bill
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppTrigger}
                      disabled={!isWhatsAppConnected}
                      className="bg-stone-850 hover:bg-stone-800 text-white font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-1.5 border border-stone-800 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      <Send size={13} />
                      Share WhatsApp
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-stone-500 text-center p-8">
              <ShoppingBag size={28} className="text-stone-750 mb-2" />
              <p className="text-xs">No bill selected</p>
              <p className="text-[10px] text-stone-600 mt-1 max-w-[200px]">Select a table order ticket from the queue list to start checkout settlement.</p>
            </div>
          )}

        </div>

      </div>

      {/* WHATSAPP MODAL PREVIEW */}
      {showWhatsAppModal && lastSavedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200">
            <div className="p-4 bg-stone-950 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">WhatsApp Invoice Share Simulator</h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-stone-400 hover:text-white cursor-pointer text-xs">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-stone-50 p-4 rounded-xl text-[11px] font-mono text-stone-700 whitespace-pre-wrap border border-stone-200 max-h-60 overflow-y-auto leading-relaxed select-text">
                {whatsAppMessageText}
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Simulating message transmission to: <strong>{lastSavedBill.customerWhatsapp || "Walk-In"}</strong></span>
              </div>
              <button
                onClick={confirmSendWhatsApp}
                className="w-full bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-black py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Send Mock WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceiptModal && lastSavedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200 my-8">
            <div className="p-4 bg-stone-950 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Simulated 80mm Receipt Printout</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-stone-400 hover:text-white cursor-pointer text-xs">✕</button>
            </div>
            <div className="p-6 bg-stone-50 flex justify-center border-b border-stone-150">
              
              {/* Receipt Body */}
              <div className="bg-white p-5 border border-stone-200 shadow-xs max-w-[280px] w-full text-[10px] text-stone-700 font-mono leading-normal select-text">
                <div className="text-center font-bold text-xs uppercase text-stone-900">{businessName}</div>
                <div className="text-center text-[9px] text-stone-500 mb-4">{settingsData?.address || "Goa, India"}</div>
                
                <div className="border-t border-dashed border-stone-300 py-2 space-y-1 text-[9px]">
                  <div>RECEIPT: {lastSavedBill.billNo}</div>
                  <div>DATE: {lastSavedBill.date} {lastSavedBill.timestamp}</div>
                  <div>TABLE: {selectedOrder?.table ? selectedOrder.table.tableNumber : "Walk-in"}</div>
                  <div>CASHIER: {selectedOrder?.user ? selectedOrder.user.name : "System"}</div>
                </div>

                <div className="border-t border-dashed border-stone-300 py-2">
                  <div className="flex justify-between font-bold text-stone-950 mb-1.5">
                    <span>ITEM</span>
                    <span>QTY / VAL</span>
                  </div>
                  <div className="space-y-1">
                    {lastSavedBill.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.itemName}</span>
                        <span>{it.quantity}x ₹{it.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-300 py-2 space-y-1 text-right text-[9px]">
                  <div>SUBTOTAL: ₹{lastSavedBill.subtotal}</div>
                  {lastSavedBill.tax > 0 && <div>GST ({gstRate}%): ₹{lastSavedBill.tax}</div>}
                  <div className="font-bold text-stone-950 text-xs mt-1">TOTAL PAID: ₹{lastSavedBill.grandTotal}</div>
                </div>

                <div className="border-t border-dashed border-stone-300 pt-3 text-center text-[9px] text-stone-500">
                  {settingsData?.receiptFooter || "Thank you for dining with us!"}
                </div>
              </div>

            </div>
            
            <div className="p-4 bg-white flex justify-between gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-stone-900 hover:bg-stone-850 text-white font-bold py-2 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Printer size={13} />
                <span>Browser Print</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-black py-2 rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
