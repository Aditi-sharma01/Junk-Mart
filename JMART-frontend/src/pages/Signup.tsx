import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "../components/ui/use-toast";
import { useAuth } from "../lib/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      console.log("Sending OTP request:", { email, username });
      
      // Send OTP instead of creating account directly
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username }),
      });
      
      console.log("OTP response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("OTP response data:", data);
        toast({ title: "OTP sent successfully! Check your email." });
        // Navigate to OTP verification page with user data
        navigate("/verify-otp", { 
          state: { email, username, password } 
        });
      } else {
        let error;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          error = await res.json();
        } else {
          error = { detail: `Request failed with status ${res.status}` };
        }
        console.error("OTP error:", error);
        toast({ title: "Failed to send OTP", description: error.detail, variant: "destructive" });
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 bg-white rounded shadow">
        <h2 className="mb-6 text-2xl font-bold text-center">Sign Up</h2>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            pattern={emailRegex.source}
          />
        </div>
        <div className="mb-6">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending OTP..." : "Send Verification Code"}
        </Button>
        <div className="mt-4 text-center">
          <span>Already have an account? </span>
          <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </div>
      </form>
    </div>
  );
};

export default Signup; 