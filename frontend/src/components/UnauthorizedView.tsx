import React from "react";
import { AuthUser, PageId } from "../types";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

interface UnauthorizedViewProps {
  user: AuthUser;
  attemptedPage: PageId;
  onNavigateToDefault: () => void;
}

export default function UnauthorizedView({
  user,
  attemptedPage,
  onNavigateToDefault,
}: UnauthorizedViewProps) {
  const formatPageName = (page: string) => {
    switch (page) {
      case "billing":
        return "Live Billing POS";
      case "orders":
        return "Order Taking";
      case "kitchen":
        return "Kitchen Display";
      case "menu":
        return "Menu Management";
      case "customers":
        return "Customer Database";
      case "sales":
        return "Sales Summary";
      case "settings":
        return "Desk Settings";
      default:
        return page;
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
        
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
          <ShieldAlert size={32} />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wider">
            <Lock size={12} />
            <span>403 Unauthorized Access</span>
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            Restricted Terminal Section
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
            Your current account role <strong className="text-stone-900 font-bold uppercase">({user.displayRoleName})</strong> is restricted from accessing <strong className="text-stone-900 font-bold">"{formatPageName(attemptedPage)}"</strong>.
          </p>
        </div>

        {/* User Role Card */}
        <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-left text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-semibold">User:</span>
            <span className="text-stone-900 font-bold">{user.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-semibold">Role:</span>
            <span className="text-[#E8872A] font-extrabold uppercase">{user.displayRoleName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500 font-semibold">Primary Workspace:</span>
            <span className="text-stone-900 font-bold">{formatPageName(user.defaultPage)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onNavigateToDefault}
          className="w-full bg-[#1C1C1E] hover:bg-stone-800 active:scale-[0.99] text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Return to {formatPageName(user.defaultPage)}</span>
        </button>

      </div>
    </div>
  );
}
