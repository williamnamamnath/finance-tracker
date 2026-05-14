import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to FinanceTracker</h1>
      <p className="mb-6">Track income and expenses and budget better.</p>
      <div className="space-x-4">
        <Link to="/login" className="px-4 py-2 bg-blue-500 text-white rounded">Login</Link>
        <Link to="/signup" className="px-4 py-2 border rounded">Signup</Link>
      </div>
    </div>
  );
}
