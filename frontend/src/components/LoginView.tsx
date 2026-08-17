import React, { useState } from "react";
import { AuthUser } from "../types";
import { authApi } from "../api";
import { saveStoredUser } from "../authData";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import secretVibezLogo from "../assets/images/secret_vibez_logo.jpg";

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  businessName?: string;
  businessLogo?: string;
}

export default function LoginView({
  onLoginSuccess,
  businessName = "Secret Vibez",
  businessLogo = secretVibezLogo
}: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validation checks
    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    authApi.login({ email: trimmedEmail, password: trimmedPassword })
      .then((res) => {
        saveStoredUser(res.user);
        setIsLoading(false);
        onLoginSuccess(res.user);
      })
      .catch((err) => {
        setIsLoading(false);
        setErrorMessage(err.message || "Invalid email or password. Please try again.");
      });
  };



  return (
    <div className="min-h-screen w-screen bg-[#1C1C1E] flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-[#262629] border border-stone-800 rounded-3xl p-5 sm:p-8 shadow-2xl text-stone-100 space-y-7">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            {businessLogo && (businessLogo.startsWith("/") || businessLogo.startsWith("http") || businessLogo.includes(".") || businessLogo.startsWith("data:")) ? (
              <img
                src={businessLogo}
                alt={`${businessName} Logo`}
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-cover rounded-2xl border border-stone-700 bg-stone-900 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-3xl font-bold">
                {businessName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-black font-display tracking-tight text-white uppercase">
              {businessName} POS
            </h1>
            <p className="text-[#E8872A] text-xs font-semibold uppercase tracking-wider mt-0.5">
              Food &amp; Stay Terminal
            </p>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-white">Welcome back</h2>
          <p className="text-xs text-stone-400 font-medium">
            Sign in to access your POS workspace
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-150">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email / Username field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@secretvibez.com"
                className="w-full bg-[#18181A] border border-stone-700/80 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-white placeholder-stone-600 focus:outline-none focus:border-[#E8872A] focus:ring-1 focus:ring-[#E8872A] transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#18181A] border border-stone-700/80 rounded-xl py-3 pl-10 pr-11 text-xs font-medium text-white placeholder-stone-600 focus:outline-none focus:border-[#E8872A] focus:ring-1 focus:ring-[#E8872A] transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E8872A] hover:bg-[#d47820] active:scale-[0.99] text-stone-950 font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-stone-950" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Login to POS</span>
            )}
          </button>
        </form>



      </div>
    </div>
  );
}
