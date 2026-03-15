import { useState, useEffect } from "react";
import {
  Shield, Lock, Unlock, KeyRound, Eye, EyeOff,
  Settings, LogOut, Check, X, AlertTriangle, Key, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminPanelProps {
  isLocked: boolean;
  isAdminVerified: boolean;
  onAdminLogin: (pin: string) => boolean;
  onAdminLogout: () => void;
  onLock: (pin: string) => boolean;
  onUnlock: (pin: string) => boolean;
  onChangePin: (current: string, newPin: string) => { success: boolean; error?: string };
}

export function AdminPanel({
  isLocked,
  isAdminVerified,
  onAdminLogin,
  onAdminLogout,
  onLock,
  onUnlock,
  onChangePin,
}: AdminPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all",
          )}
          style={{
            background: isLocked
              ? "linear-gradient(135deg, hsl(0 75% 52%), hsl(340 70% 48%), hsl(10 65% 50%))"
              : "linear-gradient(135deg, hsl(260 65% 55%), hsl(280 60% 50%), hsl(300 55% 52%))",
            color: "hsl(0 0% 100%)",
            border: isLocked
              ? "1px solid hsl(0 75% 52% / 0.4)"
              : "1px solid hsl(260 65% 55% / 0.4)",
            boxShadow: isLocked
              ? "0 0 20px -4px hsl(0 75% 52% / 0.4)"
              : "0 0 20px -4px hsl(260 65% 55% / 0.35)",
          }}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
          <span>{isLocked ? "LOCKED" : "Admin"}</span>
          {isLocked && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">🔐</span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent
        className="p-0 border-0 rounded-3xl overflow-hidden max-w-md"
        style={{
          background: "linear-gradient(160deg, hsl(230 30% 14%), hsl(250 35% 16%), hsl(270 30% 15%))",
          boxShadow: "0 40px 80px -20px hsl(250 50% 10% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.08)",
          border: "1px solid hsl(0 0% 100% / 0.08)",
        }}
      >
        {/* Top gradient bar */}
        <div className="h-1"
          style={{ background: "linear-gradient(90deg, hsl(340 72% 55%), hsl(250 80% 60%), hsl(160 70% 45%), hsl(35 90% 55%))" }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl"
              style={{
                background: "linear-gradient(135deg, hsl(260 60% 55% / 0.3), hsl(300 55% 50% / 0.3))",
                border: "1px solid hsl(0 0% 100% / 0.1)",
              }}
            >
              <Shield className="w-5 h-5" style={{ color: "hsl(260 70% 70%)" }} />
            </div>
            <div>
              <h2 className="text-base font-black"
                style={{
                  background: "linear-gradient(135deg, hsl(0 0% 100%), hsl(0 0% 80%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                🔐 Admin Panel
              </h2>
              <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                প্রজেক্ট লক ও নিরাপত্তা ম্যানেজমেন্ট
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {!isAdminVerified ? (
            <LoginForm onLogin={onAdminLogin} />
          ) : (
            <>
              <AdminDashboard
                isLocked={isLocked}
                onLock={onLock}
                onUnlock={onUnlock}
                onChangePin={onChangePin}
                onLogout={() => {
                  onAdminLogout();
                }}
              />
              <div className="mt-4">
                <ApiKeyManager />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────── Login Form ─────────────────── */
function LoginForm({ onLogin }: { onLogin: (pin: string) => boolean }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(pin)) {
      setError("");
    } else {
      setError("❌ PIN ভুল হয়েছে");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPin("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      <div className="p-4 rounded-2xl" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
        <p className="text-[11px] font-semibold mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          Admin PIN দিয়ে ভেরিফাই করুন
        </p>
        <div className="relative">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.25)" }} />
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
            maxLength={8}
            placeholder="PIN লিখুন"
            autoFocus
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none placeholder:text-white/20"
            style={{
              background: "hsl(0 0% 100% / 0.05)",
              border: error ? "1.5px solid hsl(0 70% 55% / 0.5)" : "1.5px solid hsl(0 0% 100% / 0.08)",
              color: "hsl(0 0% 100% / 0.9)",
            }}
          />
        </div>
        {error && <p className="text-[10px] font-bold mt-2" style={{ color: "hsl(0 70% 60%)" }}>{error}</p>}
      </div>

      <button
        type="submit"
        disabled={pin.length < 4}
        className="w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-30"
        style={{
          background: pin.length >= 4
            ? "linear-gradient(135deg, hsl(250 80% 60%), hsl(280 70% 55%))"
            : "hsl(0 0% 100% / 0.05)",
          color: "hsl(0 0% 100%)",
          border: "1px solid hsl(250 80% 60% / 0.3)",
          boxShadow: pin.length >= 4 ? "0 8px 24px -6px hsl(250 80% 60% / 0.4)" : "none",
        }}
      >
        Verify & Enter
      </button>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>
    </form>
  );
}

/* ─────────────────── Admin Dashboard ─────────────────── */
function AdminDashboard({
  isLocked,
  onLock,
  onUnlock,
  onChangePin,
  onLogout,
}: {
  isLocked: boolean;
  onLock: (pin: string) => boolean;
  onUnlock: (pin: string) => boolean;
  onChangePin: (current: string, newPin: string) => { success: boolean; error?: string };
  onLogout: () => void;
}) {
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [lockPin, setLockPin] = useState("");
  const [lockError, setLockError] = useState("");

  const handleToggleLock = () => {
    if (isLocked) {
      if (onUnlock(lockPin)) {
        setLockPin("");
        setLockError("");
      } else {
        setLockError("PIN ভুল");
      }
    } else {
      if (onLock(lockPin)) {
        setLockPin("");
        setLockError("");
      } else {
        setLockError("PIN ভুল");
      }
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      setPinError("নতুন PIN দুটি মিলছে না");
      return;
    }
    const result = onChangePin(currentPin, newPin);
    if (result.success) {
      setPinSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setPinError("");
      setTimeout(() => {
        setPinSuccess(false);
        setShowPinChange(false);
      }, 2000);
    } else {
      setPinError(result.error || "ত্রুটি হয়েছে");
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="p-4 rounded-2xl" style={{
        background: isLocked
          ? "linear-gradient(135deg, hsl(0 60% 25% / 0.3), hsl(340 50% 22% / 0.3))"
          : "linear-gradient(135deg, hsl(160 50% 20% / 0.3), hsl(140 45% 18% / 0.3))",
        border: `1px solid ${isLocked ? "hsl(0 60% 45% / 0.2)" : "hsl(160 50% 40% / 0.2)"}`,
      }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl" style={{
            background: isLocked ? "hsl(0 65% 50% / 0.2)" : "hsl(160 60% 42% / 0.2)",
          }}>
            {isLocked
              ? <Lock className="w-5 h-5" style={{ color: "hsl(0 65% 60%)" }} />
              : <Unlock className="w-5 h-5" style={{ color: "hsl(160 60% 55%)" }} />
            }
          </div>
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-wider"
              style={{ color: isLocked ? "hsl(0 65% 65%)" : "hsl(160 60% 60%)" }}>
              {isLocked ? "🔒 PROJECT LOCKED" : "🔓 PROJECT UNLOCKED"}
            </p>
            <p className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
              {isLocked ? "সব ফিচার বন্ধ আছে" : "সব ফিচার চালু আছে"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <input
              type="password"
              value={lockPin}
              onChange={(e) => { setLockPin(e.target.value.replace(/\D/g, "")); setLockError(""); }}
              maxLength={8}
              placeholder="PIN"
              className="w-full px-3 py-2 rounded-lg text-[11px] outline-none"
              style={{
                background: "hsl(0 0% 100% / 0.06)",
                border: lockError ? "1px solid hsl(0 70% 55% / 0.4)" : "1px solid hsl(0 0% 100% / 0.08)",
                color: "hsl(0 0% 100% / 0.8)",
              }}
            />
            {lockError && <p className="text-[9px] mt-1" style={{ color: "hsl(0 70% 60%)" }}>{lockError}</p>}
          </div>
          <button
            onClick={handleToggleLock}
            disabled={lockPin.length < 4}
            className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-30"
            style={{
              background: isLocked
                ? "linear-gradient(135deg, hsl(160 70% 42%), hsl(140 65% 38%))"
                : "linear-gradient(135deg, hsl(0 70% 50%), hsl(340 65% 48%))",
              color: "hsl(0 0% 100%)",
              boxShadow: lockPin.length >= 4
                ? `0 4px 16px -4px ${isLocked ? "hsl(160 70% 42% / 0.4)" : "hsl(0 70% 50% / 0.4)"}`
                : "none",
            }}
          >
            {isLocked ? "Unlock" : "Lock"}
          </button>
        </div>
      </div>

      {/* PIN Change Section */}
      <div className="p-4 rounded-2xl" style={{
        background: "hsl(0 0% 100% / 0.04)",
        border: "1px solid hsl(0 0% 100% / 0.06)",
      }}>
        <button
          onClick={() => setShowPinChange(!showPinChange)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Settings className="w-4 h-4" style={{ color: "hsl(35 90% 55%)" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            PIN পরিবর্তন করুন
          </span>
          <span className="ml-auto text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
            {showPinChange ? "▲" : "▼"}
          </span>
        </button>

        {showPinChange && (
          <form onSubmit={handleChangePin} className="mt-4 space-y-3">
            {/* Current PIN */}
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                placeholder="বর্তমান PIN"
                className="w-full px-3 py-2.5 rounded-lg text-[11px] outline-none pr-10"
                style={{
                  background: "hsl(0 0% 100% / 0.05)",
                  border: "1px solid hsl(0 0% 100% / 0.08)",
                  color: "hsl(0 0% 100% / 0.8)",
                }}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showCurrent
                  ? <EyeOff className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                  : <Eye className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                }
              </button>
            </div>

            {/* New PIN */}
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPin}
                onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
                maxLength={8}
                placeholder="নতুন PIN"
                className="w-full px-3 py-2.5 rounded-lg text-[11px] outline-none pr-10"
                style={{
                  background: "hsl(0 0% 100% / 0.05)",
                  border: "1px solid hsl(0 0% 100% / 0.08)",
                  color: "hsl(0 0% 100% / 0.8)",
                }}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showNew
                  ? <EyeOff className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                  : <Eye className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                }
              </button>
            </div>

            {/* Confirm PIN */}
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
              maxLength={8}
              placeholder="নতুন PIN নিশ্চিত করুন"
              className="w-full px-3 py-2.5 rounded-lg text-[11px] outline-none"
              style={{
                background: "hsl(0 0% 100% / 0.05)",
                border: "1px solid hsl(0 0% 100% / 0.08)",
                color: "hsl(0 0% 100% / 0.8)",
              }}
            />

            {pinError && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" style={{ color: "hsl(0 70% 60%)" }} />
                <p className="text-[10px] font-bold" style={{ color: "hsl(0 70% 60%)" }}>{pinError}</p>
              </div>
            )}

            {pinSuccess && (
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3" style={{ color: "hsl(160 70% 50%)" }} />
                <p className="text-[10px] font-bold" style={{ color: "hsl(160 70% 50%)" }}>✅ PIN সফলভাবে পরিবর্তন হয়েছে!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!currentPin || newPin.length < 4 || !confirmPin}
              className="w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30"
              style={{
                background: "linear-gradient(135deg, hsl(35 85% 50%), hsl(25 80% 48%))",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(35 85% 50% / 0.3)",
              }}
            >
              PIN আপডেট করুন
            </button>
          </form>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
        style={{
          background: "hsl(0 0% 100% / 0.04)",
          border: "1px solid hsl(0 0% 100% / 0.06)",
          color: "hsl(0 0% 100% / 0.4)",
        }}
      >
        <LogOut className="w-3.5 h-3.5" />
        Admin Logout
      </button>
    </div>
  );
}

/* ─────────────────── API Key Manager ─────────────────── */
function ApiKeyManager() {
  const [showSection, setShowSection] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [keyExists, setKeyExists] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const fetchKeyStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resp = await supabase.functions.invoke("manage-api-keys", {
        body: { action: "get", key: "GEMINI_API_KEY" },
      });

      if (resp.data) {
        setKeyExists(resp.data.exists);
        setMaskedKey(resp.data.masked);
      }
    } catch {}
  };

  useEffect(() => {
    if (showSection) fetchKeyStatus();
  }, [showSection]);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setStatus("idle");

    try {
      const resp = await supabase.functions.invoke("manage-api-keys", {
        body: { action: "set", key: "GEMINI_API_KEY", value: apiKey.trim() },
      });

      if (resp.data?.success) {
        setStatus("success");
        setStatusMsg("✅ API Key সেভ হয়েছে!");
        setApiKey("");
        fetchKeyStatus();
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        throw new Error(resp.data?.error || "Failed");
      }
    } catch (e: any) {
      setStatus("error");
      setStatusMsg(`❌ ${e.message || "সেভ করতে ব্যর্থ"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await supabase.functions.invoke("manage-api-keys", {
        body: { action: "delete", key: "GEMINI_API_KEY" },
      });
      setKeyExists(false);
      setMaskedKey(null);
      setStatus("success");
      setStatusMsg("🗑️ API Key মুছে ফেলা হয়েছে");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setStatusMsg("❌ মুছতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl" style={{
      background: "hsl(0 0% 100% / 0.04)",
      border: "1px solid hsl(0 0% 100% / 0.06)",
    }}>
      <button
        onClick={() => setShowSection(!showSection)}
        className="flex items-center gap-2 w-full text-left"
      >
        <Key className="w-4 h-4" style={{ color: "hsl(200 80% 55%)" }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          Gemini API Key
        </span>
        {keyExists && (
          <span className="ml-1 px-2 py-0.5 rounded-full text-[8px] font-bold"
            style={{ background: "hsl(160 60% 42% / 0.2)", color: "hsl(160 60% 55%)" }}>
            সেট আছে
          </span>
        )}
        <span className="ml-auto text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
          {showSection ? "▲" : "▼"}
        </span>
      </button>

      {showSection && (
        <div className="mt-4 space-y-3">
          {/* Current key status */}
          {keyExists && maskedKey && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{
              background: "hsl(160 50% 20% / 0.2)",
              border: "1px solid hsl(160 50% 40% / 0.15)",
            }}>
              <Key className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(160 60% 55%)" }} />
              <span className="text-[11px] font-mono flex-1" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                {maskedKey}
              </span>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                style={{
                  background: "hsl(0 60% 45% / 0.2)",
                  color: "hsl(0 65% 60%)",
                  border: "1px solid hsl(0 60% 45% / 0.2)",
                }}
              >
                মুছুন
              </button>
            </div>
          )}

          {/* Input for new key */}
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setStatus("idle"); }}
              placeholder={keyExists ? "নতুন Key দিন (পরিবর্তন করতে)" : "Gemini API Key পেস্ট করুন"}
              className="w-full px-3 py-2.5 rounded-lg text-[11px] outline-none pr-10 font-mono"
              style={{
                background: "hsl(0 0% 100% / 0.05)",
                border: "1px solid hsl(0 0% 100% / 0.08)",
                color: "hsl(0 0% 100% / 0.8)",
              }}
            />
            <button type="button" onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              {showKey
                ? <EyeOff className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                : <Eye className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
              }
            </button>
          </div>

          {/* Status message */}
          {status !== "idle" && (
            <div className="flex items-center gap-1.5">
              {status === "success"
                ? <Check className="w-3 h-3" style={{ color: "hsl(160 70% 50%)" }} />
                : <AlertTriangle className="w-3 h-3" style={{ color: "hsl(0 70% 60%)" }} />
              }
              <p className="text-[10px] font-bold" style={{
                color: status === "success" ? "hsl(160 70% 50%)" : "hsl(0 70% 60%)",
              }}>{statusMsg}</p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || loading}
            className="w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            style={{
              background: apiKey.trim()
                ? "linear-gradient(135deg, hsl(200 75% 50%), hsl(220 70% 48%))"
                : "hsl(0 0% 100% / 0.05)",
              color: "hsl(0 0% 100%)",
              border: "1px solid hsl(200 75% 50% / 0.3)",
              boxShadow: apiKey.trim() ? "0 8px 24px -6px hsl(200 75% 50% / 0.4)" : "none",
            }}
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {keyExists ? "API Key আপডেট করুন" : "API Key সেভ করুন"}
          </button>

          {/* Help text */}
          <p className="text-[9px] leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
            💡 Google AI Studio থেকে API Key নিন: aistudio.google.com → Get API Key
          </p>
        </div>
      )}
    </div>
  );
}
