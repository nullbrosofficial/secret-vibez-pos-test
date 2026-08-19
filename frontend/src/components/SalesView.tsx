import React, { useState, useMemo } from "react";
import { Bill } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell, Legend, PieChart, Pie
} from "recharts";
import { 
  TrendingUp, IndianRupee, FileText, ShoppingBag, 
  Calendar, Award, ArrowUpRight, ArrowDownRight, Clock, Search, Filter
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api";

export default function SalesView() {
  const [range, setRange] = useState<"today" | "week" | "month" | "custom">("week");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Queries
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["reports", "sales", range, startDate, endDate],
    queryFn: () => reportsApi.getSales({ range, startDate, endDate })
  });

  const summary = reportData?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalDiscount: 0,
    totalTax: 0,
    cancelledOrdersCount: 0
  };

  const chartData = useMemo(() => {
    if (!reportData?.chartData || reportData.chartData.length === 0) {
      return [
        { name: "No Data", "Sales Revenue (₹)": 0, "Total Orders": 0 }
      ];
    }
    return reportData.chartData.map((d: any) => ({
      dateStr: d.name,
      "Sales Revenue (₹)": d.sales,
      "Total Orders": d.orders
    }));
  }, [reportData]);

  const topDishesData = useMemo(() => {
    if (!reportData?.topItems) return [];
    return reportData.topItems.map((item: any) => ({
      name: item.name,
      "Quantity Sold": item.quantity,
      "Sales Value (₹)": item.revenue
    }));
  }, [reportData]);

  const PIE_COLORS = ["#E8872A", "#1C1C1E", "#2D9F6B", "#8B5CF6", "#EC4899"];

  const paymentBreakdownData = useMemo(() => {
    if (!reportData?.paymentBreakdown) return [];
    const splits = reportData.paymentBreakdown;
    return [
      { name: "Cash", value: splits.Cash },
      { name: "UPI / QR", value: splits.UPI },
      { name: "Card", value: splits.Card }
    ].filter(d => d.value > 0);
  }, [reportData]);

  const orders = reportData?.orders || [];

  return (
    <div className="space-y-6">
      
      {/* FILTER RANGE CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest font-display">Sales &amp; Business Reports</h2>
          <p className="text-xs text-stone-500 mt-0.5">Toggle date range filter to aggregate sales aggregates from the POS database.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick ranges */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/40 text-xs font-bold">
            {(["today", "week", "month", "custom"] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                  range === r
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {r === "week" ? "7 Days" : r === "month" ? "30 Days" : r}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {range === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                className="bg-stone-50 border border-stone-200 rounded-lg py-1.5 px-2.5 text-stone-900 font-semibold focus:bg-white outline-none"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span className="text-stone-400 font-bold">to</span>
              <input
                type="date"
                className="bg-stone-50 border border-stone-200 rounded-lg py-1.5 px-2.5 text-stone-900 font-semibold focus:bg-white outline-none"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-stone-500 font-semibold text-sm">
          Generating reports...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-stone-500 font-bold block uppercase tracking-wider text-[9px]">Revenue</span>
                <span className="text-2xl font-bold font-mono text-stone-950 block mt-1">₹{summary.totalRevenue}</span>
                <span className="text-[10px] text-stone-400 font-medium block mt-1">
                  Tax GST: ₹{summary.totalTax}
                </span>
              </div>
              <div className="bg-brand-accent/15 p-3 rounded-xl text-brand-accent">
                <IndianRupee size={20} />
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-stone-500 font-bold block uppercase tracking-wider text-[9px]">Total Bills</span>
                <span className="text-2xl font-bold font-mono text-stone-950 block mt-1">{summary.totalOrders} Orders</span>
                <span className="text-[10px] text-stone-400 font-medium block mt-1">
                  Cancelled: {summary.cancelledOrdersCount}
                </span>
              </div>
              <div className="bg-[#1C1C1E]/10 p-3 rounded-xl text-[#1C1C1E]">
                <FileText size={20} />
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-stone-500 font-bold block uppercase tracking-wider text-[9px]">Average Order Value</span>
                <span className="text-2xl font-bold font-mono text-stone-950 block mt-1">₹{summary.averageOrderValue}</span>
                <span className="text-[10px] text-stone-400 font-medium block mt-1">
                  Per Billed Guest
                </span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl text-brand-success border border-emerald-100">
                <TrendingUp size={20} />
              </div>
            </div>

            {/* Discounts */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-stone-500 font-bold block uppercase tracking-wider text-[9px]">Discounts Applied</span>
                <span className="text-2xl font-bold font-mono text-stone-950 block mt-1">₹{summary.totalDiscount}</span>
                <span className="text-[10px] text-stone-400 font-medium block mt-1">
                  Total deductions
                </span>
              </div>
              <div className="bg-stone-100 p-3 rounded-xl text-stone-600">
                <ShoppingBag size={20} />
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daily Revenue Bar Chart (2/3 width) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs lg:col-span-2 flex flex-col h-[320px]">
              <div className="mb-4">
                <h3 className="text-sm font-bold font-display text-stone-900 uppercase tracking-wider">Revenue Trend</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">Summary of aggregate sales revenue grouped by date.</p>
              </div>
              <div className="flex-1 min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EFE9" />
                    <XAxis dataKey="dateStr" tick={{ fontSize: 9, fill: '#78716c' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#78716c' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ fontSize: '11px', background: '#1c1c1e', border: 'none', color: '#fff', borderRadius: '12px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#E8872A' }}
                    />
                    <Bar dataKey="Sales Revenue (₹)" fill="#E8872A" radius={[4, 4, 0, 0]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#1C1C1E' : '#E8872A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Selling Items (1/3 width) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col h-[320px]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display text-stone-900 uppercase tracking-wider">Bestsellers Rank</h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">Top dishes grouped by quantity purchased.</p>
                </div>
                <Award className="text-brand-accent animate-pulse" size={18} />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {topDishesData.length > 0 ? (
                  topDishesData.map((item, index) => {
                    const totalQuantities = topDishesData.reduce((sum, d) => sum + d["Quantity Sold"], 0);
                    const percent = Math.round((item["Quantity Sold"] / (totalQuantities || 1)) * 100);
                    return (
                      <div key={index} className="text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-stone-950 truncate max-w-[140px]">{item.name}</span>
                          <span className="text-stone-400 font-mono text-[10px] shrink-0 font-bold">
                            {item["Quantity Sold"]} Sold (₹{item["Sales Value (₹)"]})
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex justify-center items-center text-stone-400 italic text-[11px] text-center">
                    No bestsellers in this timeframe.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* PAYMENT SPLIT PIE CHART & AUDIT SHEET */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Split (1/3 width) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col h-[280px]">
              <div className="mb-2">
                <h3 className="text-sm font-bold font-display text-stone-900 uppercase tracking-wider">Settlement Split</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">Ratio of Cash, UPI, and Card collections.</p>
              </div>
              <div className="flex-1 min-h-[140px] flex items-center justify-center relative">
                {paymentBreakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs text-stone-400 italic">
                    No payment data recorded in this range.
                  </div>
                )}
              </div>
            </div>

            {/* Audit log (2/3 width) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs lg:col-span-2 flex flex-col h-[280px]">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-bold font-display text-stone-900 uppercase tracking-widest">Chronological Cash Register</h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">Audit log of all orders processed in this selected timeframe.</p>
                </div>
                <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                  <Clock size={12} /> Live Sync
                </div>
              </div>

              <div className="flex-1 overflow-x-auto rounded-xl border border-stone-100 overflow-y-auto">
                <table className="w-full text-left font-sans text-xs min-w-[750px]">
                  <thead>
                    <tr className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
                      <th className="p-3 pl-4">Bill No</th>
                      <th className="p-3">Invoiced Meal Items</th>
                      <th className="p-3">Time & Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right pr-6">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {orders.length > 0 ? (
                      orders.map((bill: any, index: number) => (
                        <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                          <td className="p-3 pl-4 font-mono font-extrabold text-stone-900">{bill.orderNo}</td>

                          <td className="p-3 text-stone-500 font-medium truncate max-w-[200px]">
                            {bill.items.map((it: any, idx: number) => (
                              <span key={idx}>
                                {it.itemName} ({it.quantity})
                                {idx < bill.items.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </td>
                          <td className="p-3 font-mono text-stone-500">
                            {bill.date} <span className="text-[10px]">{bill.timestamp}</span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                              bill.status === "COMPLETED" 
                                ? "bg-green-50 text-brand-success border border-green-100" 
                                : bill.status === "CANCELLED"
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-stone-50 text-stone-600 border border-stone-100"
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="p-3 text-right pr-6 font-mono font-bold text-stone-950">₹{bill.grandTotal}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                          No order records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
