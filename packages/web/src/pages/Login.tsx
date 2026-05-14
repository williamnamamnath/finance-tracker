import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="container mx-auto p-8 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full border p-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" className="w-full border p-2" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="px-4 py-2 bg-blue-500 text-white rounded">Login</button>
      </form>
    </div>
  );
}
