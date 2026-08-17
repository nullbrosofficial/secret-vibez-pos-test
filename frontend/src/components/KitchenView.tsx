import React, { useState } from "react";
import { ChefHat, Clock, CheckCircle2, Flame, Bell, Utensils, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "../api";

export default function KitchenView({ isOnline = true }: { isOnline?: boolean }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  // Queries
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderApi.list()
  });

  // Filter orders for KDS
  const tickets = React.useMemo(() => {
    return orders.filter(order => {
      const isKitchenStatus = ["SENT_TO_KITCHEN", "PREPARING", "READY", "SERVED", "BILL_REQUESTED", "PAID", "COMPLETED"].includes(order.status);
      if (!isKitchenStatus) return false;

      if (activeTab === "active") {
        return ["SENT_TO_KITCHEN", "PREPARING"].includes(order.status);
      } else {
        return ["READY", "SERVED", "BILL_REQUESTED", "PAID", "COMPLETED"].includes(order.status);
      }
    });
  }, [orders, activeTab]);

  // Mutation to update order status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      if (!isOnline) {
        throw new Error("Cannot update ticket status while offline.");
      }
      return orderApi.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    }
  });

  const handleUpdateStatus = (id: number, currentStatus: string, action: "Accept" | "Ready") => {
    let nextStatus = currentStatus;
    if (action === "Accept") nextStatus = "PREPARING";
    else if (action === "Ready") nextStatus = "READY";

    updateStatusMutation.mutate({ id, status: nextStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT_TO_KITCHEN":
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md flex items-center gap-1">
            <Bell size={12} className="animate-pulse text-rose-400" />
            <span>New Order</span>
          </span>
        );
      case "PREPARING":
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md flex items-center gap-1">
            <Flame size={12} className="text-amber-400" />
            <span>Preparing</span>
          </span>
        );
      case "READY":
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Ready to Serve</span>
          </span>
        );
      default:
        return (
          <span className="bg-stone-500/20 text-stone-300 border border-stone-500/30 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md flex items-center gap-1">
            <span>Completed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1C1C1E] text-white p-5 rounded-2xl shadow-md border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#E8872A] text-stone-950 flex items-center justify-center shrink-0">
            <ChefHat size={26} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
            </h2>
            <p className="text-xs text-stone-400 font-medium">
              Real-time kitchen order tickets & preparation tracking for Chefs.
            </p>
          </div>
        </div>

        {/* Quick KDS Stats & Filter tabs */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4.5 py-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-[#E8872A] border-[#E8872A] text-stone-950"
                : "bg-stone-800 border-stone-700 text-stone-300 hover:text-white"
            }`}
          >
            Active Tickets: <span className="font-extrabold">{orders.filter(o => ["SENT_TO_KITCHEN", "PREPARING"].includes(o.status)).length}</span>
          </button>
          
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4.5 py-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === "completed"
                ? "bg-[#E8872A] border-[#E8872A] text-stone-950"
                : "bg-stone-800 border-stone-700 text-stone-300 hover:text-white"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold p-4 rounded-xl flex items-center gap-2.5">
          <AlertCircle size={16} className="text-rose-400" />
          <span>Offline mode: Ticket preparation actions are temporarily disabled. Connect to update order states.</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-stone-500 font-semibold text-sm">
          Loading kitchen tickets...
        </div>
      ) : tickets.length > 0 ? (
        /* Tickets Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                ticket.status === "SENT_TO_KITCHEN"
                  ? "bg-[#252328] border-rose-500/40 shadow-lg text-white"
                  : ticket.status === "PREPARING"
                  ? "bg-[#212124] border-amber-500/40 text-white"
                  : "bg-[#1A1A1C] border-stone-800 opacity-90 text-stone-300"
              }`}
            >
              <div>
                {/* Ticket Top bar */}
                <div className="flex items-center justify-between border-b border-stone-700/60 pb-3 mb-3">
                  <div>
                    <span className="text-base font-black text-white block">
                      {ticket.table ? `Table ${ticket.table.tableNumber}` : "Walk-in Biller"}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">
                      Order #{ticket.orderNo} • Waiter: {ticket.user ? ticket.user.name : "System"}
                    </span>
                  </div>
                  <div>{getStatusBadge(ticket.status)}</div>
                </div>

                {/* Time Indicator */}
                <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-4 font-semibold font-mono">
                  <Clock size={14} className="text-stone-400" />
                  <span>{ticket.timestamp} ({ticket.date})</span>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-6">
                  {ticket.items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80 text-xs">
                      <div className="flex items-center justify-between font-bold text-stone-100">
                        <span>{item.itemName}</span>
                        <span className="px-2.5 py-1 rounded bg-stone-800 text-[#E8872A] font-extrabold font-mono">
                          {item.quantity}x
                        </span>
                      </div>
                      {item.notes && (
                        <div className="text-[11px] font-medium text-amber-400 mt-1.5 italic">
                          Note: "{item.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons (Large Touch Target px-4 py-4) */}
              <div className="pt-3 border-t border-stone-800 flex gap-2">
                {ticket.status === "SENT_TO_KITCHEN" && (
                  <button
                    onClick={() => handleUpdateStatus(ticket.id, ticket.status, "Accept")}
                    disabled={updateStatusMutation.isPending || !isOnline}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-sm py-4 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Flame size={16} />
                    <span>Start Preparing</span>
                  </button>
                )}

                {ticket.status === "PREPARING" && (
                  <button
                    onClick={() => handleUpdateStatus(ticket.id, ticket.status, "Ready")}
                    disabled={updateStatusMutation.isPending || !isOnline}
                    className="w-full bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-extrabold text-sm py-4 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 size={16} />
                    <span>Mark Ready</span>
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1A1A1C] border border-stone-800 rounded-2xl p-12 text-center text-stone-500">
          <Utensils className="mx-auto text-stone-700 mb-3" size={32} />
          <p className="text-sm font-semibold">No active orders in the kitchen.</p>
          <p className="text-xs text-stone-600 mt-1">Pending order tickets will display here in real time.</p>
        </div>
      )}

    </div>
  );
}
