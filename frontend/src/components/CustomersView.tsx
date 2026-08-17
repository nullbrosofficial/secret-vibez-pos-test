import React, { useState, useMemo } from "react";
import { Customer, Bill } from "../types";
import { Search, UserPlus, Calendar, IndianRupee, Sparkles, ChevronDown, ChevronUp, ShoppingBag, Eye, CalendarDays } from "lucide-react";

interface CustomersViewProps {
  customers: Customer[];
  bills: Bill[];
  onAddCustomer: (newCust: Customer) => void;
}

export default function CustomersView({
  customers,
  bills,
  onAddCustomer
}: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCustId, setExpandedCustId] = useState<number | null>(null);

  // New customer form state
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [birthday, setBirthday] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.whatsapp.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp) return;

    const newCust: Customer = {
      id: Date.now(),
      name,
      whatsapp,
      visits: 0,
      spent: 0,
      birthday: birthday || undefined
    };

    onAddCustomer(newCust);
    setName("");
    setWhatsapp("");
    setBirthday("");
    setShowAddModal(false);
  };

  const toggleExpand = (custId: number) => {
    if (expandedCustId === custId) {
      setExpandedCustId(null);
    } else {
      setExpandedCustId(custId);
    }
  };

  // Find bills associated with a specific customer
  const getCustomerBills = (customerName: string, whatsapp: string) => {
    return bills.filter(bill => 
      bill.customerName.toLowerCase() === customerName.toLowerCase() ||
      (bill.customerWhatsapp && bill.customerWhatsapp === whatsapp)
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5">
      
      {/* Header and Add Customer Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-display text-stone-950 flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-brand-accent inline-block"></span>
            Customer Lifetime Database & CRM
          </h2>
          <p className="text-xs text-stone-500">Track repeating customer metrics, view historical orders, birthdays, and expand records.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-stone-900 text-white hover:bg-black font-semibold px-4 py-2 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <UserPlus size={15} />
          Register New Customer
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-5 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
          <Search size={15} />
        </div>
        <input
          type="text"
          className="text-stone-950 bg-stone-50 border border-stone-200 focus:border-brand-accent focus:bg-white rounded-xl py-2 pl-9 pr-4 text-xs placeholder-stone-400 outline-none w-full transition-all"
          placeholder="Search customer records by name or WhatsApp phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto border border-stone-100 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs min-w-[650px]">
          <thead>
            <tr className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
              <th className="p-4 w-12"></th>
              <th className="p-4">Customer Name</th>
              <th className="p-4">WhatsApp Phone</th>
              <th className="p-4 text-center">Visits</th>
              <th className="p-4">Birthday</th>
              <th className="p-4 text-right pr-6">Total Spending</th>
              <th className="p-4 text-center w-28">Order History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((cust) => {
                const isExpanded = expandedCustId === cust.id;
                const custBills = getCustomerBills(cust.name, cust.whatsapp);

                return (
                  <React.Fragment key={cust.id}>
                    
                    {/* Row item */}
                    <tr 
                      className={`hover:bg-stone-50/70 transition-colors cursor-pointer ${
                        isExpanded ? "bg-stone-50/50" : ""
                      }`}
                      onClick={() => toggleExpand(cust.id)}
                    >
                      <td className="p-4 text-stone-400">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-stone-900 text-sm block">{cust.name}</span>
                      </td>
                      <td className="p-4 font-mono font-medium text-stone-600">{cust.whatsapp}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-stone-100 font-bold text-stone-800">
                          {cust.visits}
                        </span>
                      </td>
                      <td className="p-4 text-stone-600">
                        {cust.birthday ? (
                          <div className="flex items-center gap-1.5 font-mono">
                            <Calendar size={12} className="text-stone-400" />
                            <span>{cust.birthday}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="p-4 text-right pr-6 font-bold text-stone-900 font-mono">
                        ₹{cust.spent}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleExpand(cust.id)}
                          className="text-stone-500 hover:text-brand-accent font-semibold flex items-center justify-center gap-1 w-full text-center transition-colors"
                        >
                          <Eye size={12} />
                          <span>View ({custBills.length})</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Order History Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-4 bg-stone-50/70 border-y border-stone-200/50">
                          <div className="px-6 py-2">
                            <h4 className="font-bold text-stone-900 text-xs mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                              <ShoppingBag size={14} className="text-brand-accent" />
                              Recent Billings & Meals for {cust.name}
                            </h4>

                            {custBills.length > 0 ? (
                              <div className="space-y-3">
                                {custBills.map((bill, index) => (
                                  <div 
                                    key={index} 
                                    className="bg-white border border-stone-200/65 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-stone-900 font-mono">{bill.billNo}</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-mono text-stone-500">
                                          {bill.date} • {bill.timestamp}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide ${
                                          bill.status === "Sent" 
                                            ? "bg-green-50 text-brand-success border border-green-100" 
                                            : "bg-stone-50 text-stone-600 border border-stone-100"
                                        }`}>
                                          {bill.status}
                                        </span>
                                      </div>
                                      
                                      {/* Render food ordered */}
                                      <div className="text-stone-500 font-medium">
                                        {bill.items.map((it, idx) => (
                                          <span key={idx}>
                                            {it.itemName} <span className="font-mono text-stone-700">({it.quantity}x)</span>
                                            {idx < bill.items.length - 1 ? ", " : ""}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <span className="text-stone-400 block text-[10px]">Total Paid (GST incl.)</span>
                                      <span className="text-sm font-bold font-mono text-stone-950">₹{bill.grandTotal}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white border border-dashed border-stone-200 rounded-xl p-6 text-center text-stone-400 italic">
                                No purchase logs recorded under this customer identity yet in this session.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-400">
                  No matching customers found. Register a new user above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FULL REGISTER CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200 animate-in">
            <div className="bg-stone-950 p-4 font-display text-white text-sm font-bold flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <UserPlus size={16} className="text-brand-accent" />
                Register New Customer ID
              </span>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditi Sharma"
                  className="w-full text-stone-950 bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs outline-none focus:border-brand-accent focus:bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">WhatsApp phone number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9845012345"
                  className="w-full text-stone-950 bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:border-brand-accent focus:bg-white"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Exclude +91 prefix for desktop POS speed.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">Birthday (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <CalendarDays size={14} />
                  </div>
                  <input
                    type="date"
                    className="w-full text-stone-950 bg-stone-50 border border-stone-200 rounded-lg p-2.5 pl-8 text-xs outline-none focus:border-brand-accent focus:bg-white"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">Used to automatically trigger birthday treat discounts.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-accent text-stone-950 hover:bg-brand-accent-hover rounded-lg text-xs font-bold font-display cursor-pointer"
                >
                  Confirm Customer ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
