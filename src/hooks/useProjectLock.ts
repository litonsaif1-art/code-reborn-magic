import { useState, useEffect, useCallback } from "react";

const DEFAULT_PIN = "758900";
const STORAGE_KEY_PIN = "cc-admin-pin";
const STORAGE_KEY_LOCKED = "cc-project-locked";

export function useProjectLock() {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_LOCKED);
    return stored === "true";
  });

  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(() => {
    return sessionStorage.getItem("cc-admin-verified") === "true";
  });

  const getPin = useCallback((): string => {
    return localStorage.getItem(STORAGE_KEY_PIN) || DEFAULT_PIN;
  }, []);

  const verifyPin = useCallback(
    (pin: string): boolean => {
      return pin === getPin();
    },
    [getPin]
  );

  const toggleLock = useCallback(
    (pin: string): boolean => {
      if (!verifyPin(pin)) return false;
      const newLocked = !isLocked;
      setIsLocked(newLocked);
      localStorage.setItem(STORAGE_KEY_LOCKED, String(newLocked));
      return true;
    },
    [isLocked, verifyPin]
  );

  const unlock = useCallback(
    (pin: string): boolean => {
      if (!verifyPin(pin)) return false;
      setIsLocked(false);
      localStorage.setItem(STORAGE_KEY_LOCKED, "false");
      return true;
    },
    [verifyPin]
  );

  const lock = useCallback(
    (pin: string): boolean => {
      if (!verifyPin(pin)) return false;
      setIsLocked(true);
      localStorage.setItem(STORAGE_KEY_LOCKED, "true");
      return true;
    },
    [verifyPin]
  );

  const changePin = useCallback(
    (currentPin: string, newPin: string): { success: boolean; error?: string } => {
      if (!verifyPin(currentPin)) {
        return { success: false, error: "বর্তমান PIN ভুল হয়েছে" };
      }
      if (newPin.length < 4 || newPin.length > 8) {
        return { success: false, error: "নতুন PIN ৪-৮ ডিজিটের হতে হবে" };
      }
      if (!/^\d+$/.test(newPin)) {
        return { success: false, error: "PIN শুধু সংখ্যা হতে হবে" };
      }
      localStorage.setItem(STORAGE_KEY_PIN, newPin);
      return { success: true };
    },
    [verifyPin]
  );

  const adminLogin = useCallback(
    (pin: string): boolean => {
      if (verifyPin(pin)) {
        setIsAdminVerified(true);
        sessionStorage.setItem("cc-admin-verified", "true");
        return true;
      }
      return false;
    },
    [verifyPin]
  );

  const adminLogout = useCallback(() => {
    setIsAdminVerified(false);
    sessionStorage.removeItem("cc-admin-verified");
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LOCKED) {
        setIsLocked(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return {
    isLocked,
    isAdminVerified,
    verifyPin,
    toggleLock,
    lock,
    unlock,
    changePin,
    adminLogin,
    adminLogout,
    getPin,
  };
}
