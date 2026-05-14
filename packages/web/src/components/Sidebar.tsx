import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const HIDDEN_PATHS = ["/", "/login", "/signup"];

export default function Sidebar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    navigate("/");
  }

  if (!isLoggedIn || HIDDEN_PATHS.includes(location.pathname)) 
    return null;

  return (
    <aside className="w-48 min-h-screen bg-white border-r border-gray-200 flex flex-col pt-6 shrink-0">
      <nav className="flex flex-col gap-1 px-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Dashboard
        </Link>
        <Link
          to="/income"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Income
        </Link>
        <Link
          to="/expenses"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Expenses
        </Link>
      </nav>
      <br/>
      <br/>
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
