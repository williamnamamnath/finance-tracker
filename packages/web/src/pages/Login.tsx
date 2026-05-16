import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.ts";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const token = res?.data?.token;
      if (!token) throw new Error(res?.data?.error || 'Missing token in response');
      localStorage.setItem("token", token);
      localStorage.setItem("firstName", res.data.user?.firstName ?? "");
      navigate("/dashboard");
      alert("Login successful!");
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Login failed';
      alert(message);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Login</h1>
          <p className="text-sm text-[#6E6E6E] mt-1">Sign in to your account to continue planning.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#0A84FF] text-white font-semibold rounded-lg text-sm hover:bg-blue-600 transition-colors mt-2"
          >
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#6E6E6E]">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#0A84FF] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
