import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "../components/ui/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
// Removed: import OtpInput from 'react-otp-input';

interface LocationState {
  email: string;
  username: string;
  password: string;
}

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  useEffect(() => {
    if (!state?.email || !state?.username || !state?.password) {
      navigate("/signup");
      return;
    }

    // Start countdown for resend
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, navigate]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: "Please enter a 6-digit code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // First verify OTP
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email, otp }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        toast({ title: "Invalid OTP", description: error.detail, variant: "destructive" });
        return;
      }

      // If OTP is verified, create the user account
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: state.username,
          email: state.email,
          password: state.password,
        }),
      });

      if (signupRes.ok) {
        toast({ title: "Account created successfully! Please login." });
        navigate("/login");
      } else {
        const error = await signupRes.json();
        toast({ title: "Signup failed", description: error.detail, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email, username: state.username }),
      });

      if (res.ok) {
        toast({ title: "OTP resent successfully!" });
        setCountdown(60);
      } else {
        const error = await res.json();
        toast({ title: "Failed to resend OTP", description: error.detail, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to resend OTP", variant: "destructive" });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-sm p-8 bg-white rounded shadow">
        <h2 className="mb-6 text-2xl font-bold text-center">Verify Your Email</h2>
        <p className="mb-4 text-center text-gray-600">
          We've sent a 6-digit code to <strong>{state?.email}</strong>
        </p>
        
        <div className="mb-6">
          <InputOTP value={otp} onChange={setOtp} maxLength={6} autoFocus>
            <InputOTPGroup>
              {[...Array(6)].map((_, idx) => (
                <InputOTPSlot key={idx} index={idx} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          onClick={handleVerifyOTP} 
          className="w-full mb-4" 
          disabled={loading || otp.length !== 6}
        >
          {loading ? "Verifying..." : "Verify & Create Account"}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the code?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendOTP}
            disabled={resendLoading || countdown > 0}
          >
            {resendLoading 
              ? "Sending..." 
              : countdown > 0 
                ? `Resend in ${countdown}s` 
                : "Resend Code"
            }
          </Button>
        </div>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/signup")}
          >
            Back to Signup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification; 