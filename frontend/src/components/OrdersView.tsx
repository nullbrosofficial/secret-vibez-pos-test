import React, { useState, useMemo } from "react";
import { MenuItem } from "../types";
import { Utensils, Send, CheckCircle2, Search, Plus, Minus, Trash2, Clock, Check, AlertCircle, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tableApi, orderApi } from "../api";

interface OrdersViewProps {
  menuItems: MenuItem[];
  isOnline?: boolean;
}

export default function OrdersView({ menuItems, isOnline = true }: OrdersViewProps) {
  const queryClient = useQueryClient();
  
  // Queries
  const { data: tables = [], refetch: refetchTables } = useQuery({
    queryKey: ["tables"],
    queryFn: tableApi.list
  });

  const { data: activeOrders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderApi.list() // Fetch all orders
  });

  // Only orders in the kitchen/bill flow count as truly blocking a table
  const BLOCKING_STATUSES = ["SENT_TO_KITCHEN", "PREPARING", "READY", "SERVED", "BILL_REQUESTED", "PROCESSING"];


  // State
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local waiter order basket mapped by tableId
  const [localBaskets, setLocalBaskets] = useState<Record<number, { item: MenuItem; quantity: number; notes: string }[]>>({});

  // Automatically select the first table if none is selected
  const activeTable = useMemo(() => {
    if (tables.length === 0) return null;
    const found = tables.find(t => t.id === selectedTableId);
    if (found) return found;
    setSelectedTableId(tables[0].id);
    return tables[0];
  }, [tables, selectedTableId]);

  // Find active order on the selected table — only orders in the kitchen/bill flow count as blocking
  const activeOrderForTable = useMemo(() => {
    if (!activeTable) return null;
    return activeOrders.find(
      o => o.tableId === activeTable.id && BLOCKING_STATUSES.includes(o.status)
    ) || null;
  }, [activeOrders, activeTable]);

  // Get active basket
  const currentBasket = useMemo(() => {
    if (!activeTable) return [];
    return localBaskets[activeTable.id] || [];
  }, [localBaskets, activeTable]);

  const categories = ["All", ...Array.from(new Set(menuItems.map((i) => i.category)))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchesAvailability = item.availability !== false;
    return matchesSearch && matchesCat && matchesAvailability;
  });

  const addItemToOrder = (item: MenuItem) => {
    if (!activeTable) return;
    
    if (activeTable.status === "CLEANING") {
      showError("Table is currently being cleaned. Mark it available first.");
      return;
    }

    if (activeOrderForTable) {
      showError("Table is currently occupied. Settle payment at POS before editing active tickets.");
      return;
    }

    setLocalBaskets((prev) => {
      const basket = prev[activeTable.id] || [];
      const idx = basket.findIndex((i) => i.item.id === item.id);

      // Immutably build a new basket array — never mutate the existing objects
      const updated = idx >= 0
        ? basket.map((entry, i) =>
            i === idx ? { ...entry, quantity: entry.quantity + 1 } : entry
          )
        : [...basket, { item, quantity: 1, notes: "" }];

      return { ...prev, [activeTable.id]: updated };
    });
  };

  // Dedicated quantity updater for the +/- buttons in the basket panel
  const updateItemQuantity = (itemId: number, delta: number) => {
    if (!activeTable) return;
    setLocalBaskets((prev) => {
      const basket = prev[activeTable.id] || [];
      const updated = basket
        .map((entry) =>
          entry.item.id === itemId
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0); // remove if quantity reaches 0
      return { ...prev, [activeTable.id]: updated };
    });
  };

  const updateItemNote = (itemId: number, notes: string) => {
    if (!activeTable) return;
    setLocalBaskets((prev) => {
      const basket = prev[activeTable.id] || [];
      const updated = basket.map(i => i.item.id === itemId ? { ...i, notes } : i);
      return {
        ...prev,
        [activeTable.id]: updated
      };
    });
  };

  const removeItemFromOrder = (itemId: number) => {
    if (!activeTable) return;
    setLocalBaskets((prev) => {
      const basket = prev[activeTable.id] || [];
      const updated = basket.filter((i) => i.item.id !== itemId);
      return {
        ...prev,
        [activeTable.id]: updated
      };
    });
  };

  // Mutation to fire order to kitchen
  const fireOrderMutation = useMutation({
    mutationFn: (data: any) => {
      if (!isOnline) {
        throw new Error("Cannot submit orders while offline.");
      }
      return orderApi.create(data);
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      
      if (activeTable) {
        setLocalBaskets(prev => {
          const updated = { ...prev };
          delete updated[activeTable.id];
          return updated;
        });
      }

      showNotification(`Order ${order.orderNo} sent to kitchen successfully!`);
    },
    onError: (err: any) => {
      showError(err.message || "Failed to create order");
    }
  });

  // Waiter action mutations
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      showNotification("Order status updated.");
    },
    onError: (err: any) => {
      showError(err.message || "Failed to update order status");
    }
  });

  const requestBillMutation = useMutation({
    mutationFn: (id: number) => orderApi.requestBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["billsQueue"] });
      showNotification("Bill requested from cashier queue.");
    },
    onError: (err: any) => {
      showError(err.message || "Failed to request bill");
    }
  });

  const resetTableStatusMutation = useMutation({
    mutationFn: (id: number) => tableApi.updateStatus(id, "AVAILABLE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      showNotification("Table is now available for guest seating.");
    },
    onError: (err: any) => {
      showError(err.message || "Failed to reset table status");
    }
  });

  const sendToKitchen = () => {
    if (!activeTable || currentBasket.length === 0) return;
    setErrorMessage(null);

    fireOrderMutation.mutate({
      tableId: activeTable.id,
      status: "SENT_TO_KITCHEN",
      items: currentBasket.map(b => ({
        menuItemId: b.item.id,
        quantity: b.quantity,
        notes: b.notes || null
      }))
    });
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const orderTotal = currentBasket.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner & Description */}
      <div className="bg-white border border-stone-200/80 p-5 rounded-2xl shadow-xs">
        <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Utensils size={20} className="text-[#E8872A]" />
          <span>Waiter Workspace &amp; Order Terminals</span>
        </h2>
        <p className="text-xs text-stone-500 font-medium mt-0.5">
          Enrol table checkouts, take food/beverage orders, monitor preparation progress, and request bills.
        </p>
      </div>

      {/* TABLE CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
        {tables.map((table) => {
          const isSelected = activeTable?.id === table.id;
          const hasDraft = (localBaskets[table.id] || []).length > 0;
          const activeOrder = activeOrders.find(o => o.tableId === table.id && BLOCKING_STATUSES.includes(o.status));
          
          let cardBg = "bg-white border-stone-200 hover:border-[#E8872A]";
          let badgeColor = "bg-stone-100 text-stone-600";

          if (isSelected) {
            cardBg = "bg-stone-900 border-stone-900 text-white shadow-md";
          }

          if (table.status === "OCCUPIED") {
            badgeColor = "bg-amber-100 text-amber-900 border border-amber-300";
          } else if (table.status === "BILL_REQUESTED") {
            badgeColor = "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse";
          } else if (table.status === "CLEANING") {
            badgeColor = "bg-purple-100 text-purple-900 border border-purple-200";
          } else if (hasDraft) {
            badgeColor = "bg-emerald-100 text-emerald-900 border border-emerald-200";
          }

          return (
            <div
              key={table.id}
              onClick={() => {
                setSelectedTableId(table.id);
                setErrorMessage(null);
              }}
              className={`border p-4.5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all space-y-3 select-none ${cardBg}`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black tracking-tight">Table {table.tableNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${badgeColor}`}>
                    {table.status}
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 mt-1">{table.capacity} Seats</div>
              </div>

              {activeOrder && (
                <div className="pt-2 border-t border-dashed border-stone-150/20 text-[9px] text-stone-400 font-mono">
                  Order: #{activeOrder.orderNo}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Menu selection (Left) & Active Table Basket (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Menu Items Picker */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search & Category filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish or beverage..."
                className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E8872A]"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4.5 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#E8872A] text-stone-950 shadow-2xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addItemToOrder(item)}
                className="bg-white border border-stone-200 hover:border-[#E8872A] hover:shadow-md p-4 rounded-2xl text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#E8872A] tracking-wider block">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-bold text-stone-900 mt-1.5 group-hover:text-[#E8872A] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-stone-100">
                  <span className="text-sm font-black text-stone-900">₹{item.price}</span>
                  <span className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-[#E8872A] group-hover:text-stone-950 text-stone-600 flex items-center justify-center transition-all">
                    <Plus size={16} />
                  </span>
                </div>
              </button>
            ))}
          </div>

        </div>

        {/* Right column: Current Table Ticket */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  Table {activeTable?.tableNumber || ""} Ticket Panel
                </h3>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mt-1">
                  Table Status: <strong className="text-stone-700">{activeTable?.status}</strong>
                </span>
              </div>
            </div>

            {/* Offline Safeguard Banner */}
            {!isOnline && (
              <div className="mt-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-400 shrink-0" />
                <span>Orders cannot be sent while offline.</span>
              </div>
            )}

            {/* CLEANING RESET STATE */}
            {activeTable?.status === "CLEANING" ? (
              <div className="space-y-4 text-center py-12">
                <AlertCircle size={32} className="text-[#E8872A] mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">Table Needs Cleaning</h4>
                  <p className="text-[10px] text-stone-500">Wait for staff to clean this desk before taking any new orders.</p>
                </div>
                <button
                  onClick={() => resetTableStatusMutation.mutate(activeTable.id)}
                  disabled={resetTableStatusMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Mark Table Available
                </button>
              </div>
            ) : activeOrderForTable ? (
              /* ACTIVE MOUNTED TICKET (Tracking preparation lifecycle) */
              <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-4 text-xs">
                
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-stone-150 pb-2">
                  <span className="font-extrabold text-stone-900 font-mono">ORDER: #{activeOrderForTable.orderNo}</span>
                  <span className="text-[9px] font-extrabold bg-[#E8872A] text-stone-950 px-2 py-0.5 rounded uppercase tracking-wider">
                    {activeOrderForTable.status}
                  </span>
                </div>

                {/* Checklist Tracker */}
                <div className="space-y-2 border-b border-stone-150 pb-3">
                  <span className="block text-[9px] font-extrabold text-stone-400 uppercase tracking-wider">KDS Checklist</span>
                  <div className="space-y-1.5 font-bold">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check size={13} className="stroke-[2.5]" />
                      <span>Order received by Kitchen</span>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${
                      ["PREPARING", "READY", "SERVED", "BILL_REQUESTED", "PAID", "COMPLETED"].includes(activeOrderForTable.status)
                        ? "text-emerald-600"
                        : "text-stone-300"
                    }`}>
                      <Check size={13} className="stroke-[2.5]" />
                      <span>Preparing dishes</span>
                    </div>

                    <div className={`flex items-center gap-2 ${
                      ["READY", "SERVED", "BILL_REQUESTED", "PAID", "COMPLETED"].includes(activeOrderForTable.status)
                        ? "text-emerald-600"
                        : "text-stone-300"
                    }`}>
                      <Check size={13} className="stroke-[2.5]" />
                      <span>Ready at counter</span>
                    </div>
                  </div>
                </div>

                {/* Items detail list */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activeOrderForTable.items.map((it: any, index: number) => (
                    <div key={index} className="flex justify-between text-stone-600 font-semibold">
                      <span>{it.itemName} <span className="text-stone-400 font-mono">x{it.quantity}</span></span>
                      <span className="font-mono text-stone-800">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Actions row */}
                <div className="pt-2 border-t border-stone-200">
                  {activeOrderForTable.status === "READY" && (
                    <button
                      onClick={() => updateOrderStatusMutation.mutate({ id: activeOrderForTable.id, status: "SERVED" })}
                      disabled={updateOrderStatusMutation.isPending}
                      className="w-full bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-black py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark as Served</span>
                    </button>
                  )}

                  {activeOrderForTable.status === "SERVED" && (
                    <button
                      onClick={() => requestBillMutation.mutate(activeOrderForTable.id)}
                      disabled={requestBillMutation.isPending}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Request Bill from Cashier</span>
                    </button>
                  )}

                  {activeOrderForTable.status === "BILL_REQUESTED" && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px]">
                      Bill requested. Settle payment at POS.
                    </div>
                  )}

                  {activeOrderForTable.status === "PAID" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px]">
                      Payment Settled. Awaiting release.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* DRAFT editor local basket */
              <div className="mt-4 space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {currentBasket.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    No items added yet. Click menu items on the left to add.
                  </div>
                ) : (
                  currentBasket.map(({ item, quantity, notes }) => (
                    <div
                      key={item.id}
                      className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 truncate pr-2">{item.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-extrabold text-stone-900">₹{item.price * quantity}</span>
                          <button
                            onClick={() => removeItemFromOrder(item.id)}
                            className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl border border-transparent hover:border-rose-200/50 transition-all cursor-pointer shrink-0"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, -1); }}
                          className="w-8 h-8 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-all cursor-pointer shrink-0 font-black"
                          title="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-stone-900">{quantity}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, +1); }}
                          className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-700 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 font-black"
                          title="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                        <span className="text-stone-400 font-semibold text-[10px]">× ₹{item.price} each</span>
                      </div>

                      {/* Notes input */}
                      <input
                        type="text"
                        placeholder="Add preparation note (e.g. no onions)..."
                        className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs placeholder-stone-400 outline-none text-stone-700 focus:border-[#E8872A]"
                        value={notes}
                        onChange={(e) => updateItemNote(item.id, e.target.value)}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Total & Kitchen Fire Button */}
          {!activeOrderForTable && activeTable?.status !== "CLEANING" && (
            <div className="border-t border-stone-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-stone-600">Total Order Value</span>
                <span className="font-black text-stone-900 text-base">₹{orderTotal}</span>
              </div>

              <button
                onClick={sendToKitchen}
                disabled={currentBasket.length === 0 || fireOrderMutation.isPending || !isOnline}
                className="w-full bg-[#E8872A] hover:bg-[#d47820] active:scale-[0.99] text-stone-950 font-extrabold text-sm py-4 px-5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                <span>{fireOrderMutation.isPending ? "Sending to Kitchen..." : "Send Order to Kitchen KDS"}</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
