import { useState, useRef, useEffect } from "react";
import { OTP_CONFIG } from "../../../constants/LOAN_SIM.js";

export const useOTPValidation = ({ email, onValidate, onResend }) => {
  const [otp, setOtp] = useState(() => new Array(OTP_CONFIG.OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const savedExpiry = localStorage.getItem("otp_cooldown_expiry");
    if (savedExpiry) {
      const remaining = Math.ceil((parseInt(savedExpiry, 10) - Date.now()) / 1000);
      if (remaining > 0) setCooldown(remaining);
      else localStorage.removeItem("otp_cooldown_expiry");
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          localStorage.removeItem("otp_cooldown_expiry");
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < OTP_CONFIG.OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_CONFIG.OTP_LENGTH);
    if (!pasteData) return;
    const newOtp = [...otp];
    pasteData.split("").forEach((char, i) => {
      if (i < OTP_CONFIG.OTP_LENGTH) newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextIndex = Math.min(pasteData.length, OTP_CONFIG.OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === OTP_CONFIG.OTP_LENGTH) onValidate(code);
  };

  const handleResendClick = async () => {
    if (cooldown > 0) return;
    if (onResend) {
      await onResend(email, true);
      const expiry = Date.now() + OTP_CONFIG.COOLDOWN_DURATION * 1000;
      localStorage.setItem("otp_cooldown_expiry", expiry.toString());
      setCooldown(OTP_CONFIG.COOLDOWN_DURATION);
    }
  };

  const isComplete = otp.every((digit) => digit !== "");
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    otp,
    inputRefs,
    cooldown,
    isComplete,
    formatTime,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    handleResendClick,
  };
};