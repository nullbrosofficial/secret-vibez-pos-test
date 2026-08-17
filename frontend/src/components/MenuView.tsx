import React, { useState, useMemo } from "react";
import { MenuItem } from "../types";
import { Plus, Edit, Trash2, Check, X, Search, ChefHat } from "lucide-react";

interface MenuViewProps {
  menuItems: MenuItem[];
  categories: string[];
  onAddMenuItem: (item: Partial<MenuItem>) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: number) => void;
}

export default function MenuView({
  menuItems,
  categories,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem
}: MenuViewProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Adding state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0] || "Main Course");
  const [newPrice, setNewPrice] = useState("");
  const [newVegNonVeg, setNewVegNonVeg] = useState<"Veg" | "Non-Veg">("Veg");
  const [newAvailability, setNewAvailability] = useState(true);
  const [newDescription, setNewDescription] = useState("");

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editVegNonVeg, setEditVegNonVeg] = useState<"Veg" | "Non-Veg">("Veg");
  const [editAvailability, setEditAvailability] = useState(true);
  const [editDescription, setEditDescription] = useState("");

  // Search and filter list
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const handleAddNewItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return;

    onAddMenuItem({
      name: newName,
      category: newCategory,
      price: parsedPrice,
      vegNonVeg: newVegNonVeg,
      availability: newAvailability,
      description: newDescription || null
    });

    setNewName("");
    setNewPrice("");
    setNewDescription("");
    setNewVegNonVeg("Veg");
    setNewAvailability(true);
    setShowAddModal(false);
  };

  const handleStartEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price.toString());
    setEditVegNonVeg((item.vegNonVeg as "Veg" | "Non-Veg") || "Veg");
    setEditAvailability(item.availability !== false);
    setEditDescription(item.description || "");
  };

  const handleSaveEdit = (id: number) => {
    const parsedPrice = parseFloat(editPrice);
    if (!editName || isNaN(parsedPrice) || parsedPrice <= 0) return;

    onUpdateMenuItem({
      id,
      name: editName,
      category: editCategory,
      price: parsedPrice,
      vegNonVeg: editVegNonVeg,
      availability: editAvailability,
      description: editDescription || null
    });

    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const toggleAvailabilityInline = (item: MenuItem) => {
    onUpdateMenuItem({
      ...item,
      availability: !item.availability
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5">
      
      {/* Top Controls Headers and Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-display text-stone-950 flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-brand-accent inline-block"></span>
            Menu & Inventory Management
          </h2>
          <p className="text-xs text-stone-500">Edit, add, or delete the food offerings, set base prices, and manage classifications.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#E8872A] hover:bg-[#d47820] text-stone-950 font-bold px-4 py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors font-display cursor-pointer"
        >
          <Plus size={15} />
          Add New Food Item
        </button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-5">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setActiveCategory("All")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
              activeCategory === "All"
                ? "bg-stone-950 text-white"
                : "bg-stone-50 text-stone-600 hover:bg-stone-100"
            }`}
          >
            All Categories
          </button>
          
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeCategory === cat
                  ? "bg-brand-accent text-stone-950 shadow-xs"
                  : "bg-stone-50 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            className="text-stone-950 bg-stone-50 border border-stone-200 focus:border-brand-accent focus:bg-white rounded-xl py-2 pl-8 pr-4 text-xs placeholder-stone-400 outline-none w-full transition-all"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Food list table */}
      <div className="overflow-x-auto border border-stone-100 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs min-w-[700px]">
          <thead>
            <tr className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
              <th className="p-4 w-12">ID</th>
              <th className="p-4">Food Item Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Category</th>
              <th className="p-4">Base Price</th>
              <th className="p-4 text-center">Availability</th>
              <th className="p-4 text-right pr-6 w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                    
                    {/* ID column */}
                    <td className="p-4 font-mono text-stone-400 font-semibold">{idx + 1}</td>
                    
                    {/* Name column */}
                    <td className="p-4">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            className="w-full text-stone-950 bg-white border border-stone-300 rounded-lg p-1.5 text-xs outline-none focus:border-brand-accent font-semibold"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <input
                            type="text"
                            className="w-full text-stone-750 bg-white border border-stone-300 rounded-lg p-1.5 text-[10px] outline-none focus:border-brand-accent"
                            placeholder="Add brief description..."
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${
                              item.vegNonVeg === "Non-Veg" ? "bg-red-500" : "bg-emerald-500"
                            }`} title={item.vegNonVeg || "Veg"}></span>
                            <span className="font-semibold text-stone-900">{item.name}</span>
                          </div>
                          {item.description && (
                            <span className="text-[10px] text-stone-400 font-medium block mt-0.5">{item.description}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Veg/Non-Veg column */}
                    <td className="p-4 font-semibold">
                      {isEditing ? (
                        <select
                          className="text-stone-950 bg-white border border-stone-300 rounded-lg p-1.5 text-xs outline-none focus:border-brand-accent cursor-pointer"
                          value={editVegNonVeg}
                          onChange={(e) => setEditVegNonVeg(e.target.value as any)}
                        >
                          <option value="Veg">Veg</option>
                          <option value="Non-Veg">Non-Veg</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.vegNonVeg === "Non-Veg" 
                            ? "bg-rose-50 text-rose-600 border border-rose-100" 
                            : "bg-green-50 text-brand-success border border-green-100"
                        }`}>
                          {item.vegNonVeg || "Veg"}
                        </span>
                      )}
                    </td>

                    {/* Category column */}
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          className="w-full text-stone-950 bg-white border border-stone-300 rounded-lg p-1.5 text-xs outline-none focus:border-brand-accent cursor-pointer"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                        >
                          {categories.filter(c => c !== "All").map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium">
                          {item.category}
                        </span>
                      )}
                    </td>

                    {/* Price column */}
                    <td className="p-4">
                      {isEditing ? (
                        <div className="relative w-24">
                          <span className="absolute left-2.5 top-1.5 text-stone-400">₹</span>
                          <input
                            type="number"
                            className="w-full text-stone-950 bg-white border border-stone-300 rounded-lg p-1.5 pl-6 text-xs outline-none focus:border-brand-accent font-bold"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                        </div>
                      ) : (
                        <span className="font-bold font-mono text-stone-900">₹{item.price}</span>
                      )}
                    </td>

                    {/* Availability toggle */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editAvailability}
                          onChange={(e) => setEditAvailability(e.target.checked)}
                          className="w-4 h-4 text-brand-accent rounded border-stone-300 focus:ring-brand-accent cursor-pointer"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleAvailabilityInline(item)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                            item.availability !== false
                              ? "bg-green-50 text-brand-success border border-green-100"
                              : "bg-stone-100 text-stone-400 border border-stone-200"
                          }`}
                        >
                          {item.availability !== false ? "Available" : "Sold Out"}
                        </button>
                      )}
                    </td>

                    {/* Actions column */}
                    <td className="p-4 text-right pr-6">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="bg-brand-success hover:bg-emerald-600 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Save Changes"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="text-stone-400 hover:text-stone-950 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                onDeleteMenuItem(item.id);
                              }
                            }}
                            className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-400">
                  <div className="flex flex-col items-center gap-2 justify-center py-6">
                    <ChefHat size={32} className="text-stone-200" />
                    <span>No dishes found in category "{activeCategory}"</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD NEW FOOD ITEM OVERLAY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-stone-950 p-4 font-display text-white text-sm font-bold flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <ChefHat size={16} className="text-brand-accent" />
                Add New Dish
              </span>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-stone-400 hover:text-white font-bold"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddNewItemSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">Item name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garlic Naan"
                  className="w-full text-stone-950 bg-stone-50 border border-stone-200 rounded-lg p-2.5 outline-none focus:border-brand-accent focus:bg-white font-semibold"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Clay-oven flatbread with minced garlic"
                  className="w-full text-stone-950 bg-stone-50 border border-stone-200 rounded-lg p-2.5 outline-none focus:border-brand-accent focus:bg-white"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">Dietary Tag *</label>
                  <select
                    required
                    className="w-full text-stone-900 bg-stone-50 border border-stone-200 rounded-lg p-2.5 outline-none focus:border-brand-accent focus:bg-white cursor-pointer font-bold"
                    value={newVegNonVeg}
                    onChange={(e) => setNewVegNonVeg(e.target.value as any)}
                  >
                    <option value="Veg">🟢 Veg</option>
                    <option value="Non-Veg">🔴 Non-Veg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">Category *</label>
                  <select
                    required
                    className="w-full text-stone-900 bg-stone-50 border border-stone-200 rounded-lg p-2.5 outline-none focus:border-brand-accent focus:bg-white cursor-pointer font-bold"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {categories.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">Price (INR ₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-mono">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="120"
                      className="w-full text-stone-950 bg-stone-50 border border-stone-200 rounded-lg p-2.5 pl-7 outline-none focus:border-brand-accent focus:bg-white font-bold font-mono"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end pb-2 pl-2">
                  <label className="flex items-center gap-2 font-semibold text-stone-750 uppercase tracking-wider select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAvailability}
                      onChange={(e) => setNewAvailability(e.target.checked)}
                      className="w-4 h-4 text-brand-accent rounded border-stone-300 focus:ring-brand-accent cursor-pointer"
                    />
                    <span>Available</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-accent text-stone-950 hover:bg-brand-accent-hover rounded-lg font-bold font-display cursor-pointer"
                >
                  Register Gourmet Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
