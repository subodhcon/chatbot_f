"use client";

import React, { useEffect, useState } from "react";
import { Settings, Shield, Key, Bell, Loader2, Check, AlertCircle, Eye, EyeOff, Copy } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { fetchWithAuth } from "@/lib/api";

type TabId = "profile" | "security" | "apiKeys" | "notifications";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // --- Profile State ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // --- Security State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // --- API Keys State ---
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // --- Notifications State ---
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  // Sync initial profile inputs with user store data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Load API Keys & Notifications from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOpenaiKey(localStorage.getItem("settings_openai_key") || "");
      setGeminiKey(localStorage.getItem("settings_gemini_key") || "");
      setEmailAlerts(localStorage.getItem("settings_email_alerts") !== "false");
      setWeeklyReports(localStorage.getItem("settings_weekly_reports") === "true");
      setSecurityAlerts(localStorage.getItem("settings_security_alerts") !== "false");
    }
  }, []);

  // --- Handlers ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    if (!name.trim() || !email.trim()) {
      setProfileError("Name and Email are required.");
      setProfileLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth<any>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name, email }),
      });

      if (response.success && response.data) {
        updateUser({
          ...user!,
          name: response.data.name,
          email: response.data.email,
        });
        setProfileSuccess("Profile updated successfully!");
      } else {
        setProfileError(response.error?.message || "Failed to update profile.");
      }
    } catch (err) {
      setProfileError("An unexpected error occurred.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);
    setSecurityLoading(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError("All fields are required.");
      setSecurityLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError("New password must be at least 6 characters long.");
      setSecurityLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError("New passwords do not match.");
      setSecurityLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth<any>("/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.success) {
        setSecuritySuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setSecurityError(response.error?.message || "Failed to update password.");
      }
    } catch (err) {
      setSecurityError("An unexpected error occurred.");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setApiSuccess(null);
    localStorage.setItem("settings_openai_key", openaiKey);
    localStorage.setItem("settings_gemini_key", geminiKey);
    setApiSuccess("API keys saved locally in your browser!");
    setTimeout(() => setApiSuccess(null), 3000);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess(null);
    localStorage.setItem("settings_email_alerts", String(emailAlerts));
    localStorage.setItem("settings_weekly_reports", String(weeklyReports));
    localStorage.setItem("settings_security_alerts", String(securityAlerts));
    setNotifSuccess("Notification settings updated successfully!");
    setTimeout(() => setNotifSuccess(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Key copied to clipboard!");
  };

  return (
    <div className="space-y-8 p-6 text-slate-800 dark:text-slate-100 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="h-8 w-8 text-violet-500" /> Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-505 dark:text-slate-400">
          Configure profile configurations, api credentials, and warning alerts.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Navigation tabs */}
        <div className="space-y-1">
          {[
            { id: "profile", label: "Account Profile", icon: Settings },
            { id: "security", label: "Security & Passwords", icon: Shield },
            { id: "apiKeys", label: "API Keys", icon: Key },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/10"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Configurations Box */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 backdrop-blur-md">
          
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-150 dark:border-slate-800">
                Profile Details
              </h2>
              
              {profileError && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{profileError}</p>
                </div>
              )}

              {profileSuccess && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4 shrink-0" />
                  <p>{profileSuccess}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 px-3.5 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled={user?.role === "superadmin"}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 px-3.5 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Enter your email address"
                  />
                  {user?.role === "superadmin" && (
                    <p className="mt-1.5 text-xs text-amber-500/80 dark:text-amber-400/80 font-medium">
                      Superadmin email address cannot be changed.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 px-5 text-sm font-semibold text-white shadow-md shadow-violet-600/10 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-55 cursor-pointer"
                >
                  {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === "security" && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-150 dark:border-slate-800">
                Security & Password
              </h2>

              {securityError && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{securityError}</p>
                </div>
              )}

              {securitySuccess && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4 shrink-0" />
                  <p>{securitySuccess}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Current Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-450 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-450 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 px-3.5 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 px-5 text-sm font-semibold text-white shadow-md shadow-violet-600/10 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-55 cursor-pointer"
                >
                  {securityLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: API KEYS */}
          {activeTab === "apiKeys" && (
            <form onSubmit={handleSaveApiKeys} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-150 dark:border-slate-800">
                API Credentials Configuration
              </h2>

              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                Save your OpenAI or Gemini key config directly in your browser&apos;s secure cache. These keys can be referenced locally during workspace testing.
              </p>

              {apiSuccess && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4 shrink-0" />
                  <p>{apiSuccess}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    OpenAI API Key
                  </label>
                  <div className="relative mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showOpenaiKey ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                        placeholder="sk-proj-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-450 hover:text-slate-650"
                      >
                        {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {openaiKey && (
                      <button
                        type="button"
                        onClick={() => handleCopy(openaiKey)}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition text-slate-500"
                        title="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Gemini API Key
                  </label>
                  <div className="relative mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showGeminiKey ? "text" : "password"}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                        placeholder="AIzaSy..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-450 hover:text-slate-650"
                      >
                        {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {geminiKey && (
                      <button
                        type="button"
                        onClick={() => handleCopy(geminiKey)}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition text-slate-500"
                        title="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 px-5 text-sm font-semibold text-white shadow-md shadow-violet-600/10 hover:from-violet-500 hover:to-indigo-500 transition cursor-pointer"
                >
                  Save API Keys
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-150 dark:border-slate-800">
                Warning Alerts & Notifications
              </h2>

              {notifSuccess && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4 shrink-0" />
                  <p>{notifSuccess}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850/50 pb-4">
                  <div>
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Email Notifications</label>
                    <p className="text-xs text-slate-500 mt-1">Receive updates for bot administration events.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      emailAlerts ? 'bg-violet-600' : 'bg-slate-250 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        emailAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850/50 pb-4">
                  <div>
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Weekly Analytics Report</label>
                    <p className="text-xs text-slate-500 mt-1">Deliver chatbot usage statistics straight to your email.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeeklyReports(!weeklyReports)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      weeklyReports ? 'bg-violet-600' : 'bg-slate-250 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        weeklyReports ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 pb-4">
                  <div>
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Security Warnings</label>
                    <p className="text-xs text-slate-500 mt-1">Alert when a new login occurs from an unrecognized device.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityAlerts(!securityAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      securityAlerts ? 'bg-violet-600' : 'bg-slate-250 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        securityAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 px-5 text-sm font-semibold text-white shadow-md shadow-violet-600/10 hover:from-violet-500 hover:to-indigo-500 transition cursor-pointer"
                >
                  Update Warnings
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
