import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const HIDDEN_PATHS = ["/", "/login", "/signup"];

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/income", label: "Income" },
  { to: "/expenses", label: "Expenses" },
  { to: "/calendar", label: "Calendar" },
  { to: "/upcoming", label: "Upcoming" },
  { to: "/past-transactions", label: "Past Transactions" },
];

export default function Navbar() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("firstName");
    setFirstName(token ? name : null);
  }, [location]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    setFirstName(null);
    setDropdownOpen(false);
    navigate("/");
    alert("Logged out successfully!");
  }

  const showNav = firstName !== null && !HIDDEN_PATHS.includes(location.pathname);

  return (
    <nav className="relative bg-white shadow-sm">
      <div className="container mx-auto flex justify-between items-center px-4 py-4">
        <div className="flex items-center gap-3">
          {showNav && (
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-1 rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
          <Link to={firstName !== null ? "/dashboard" : "/"} className="font-bold text-3xl">FinanceTracker</Link>
        </div>
        <div className="space-x-4 flex items-center">
          {firstName !== null ? (
            <>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="cursor-pointer select-none font-bold flex items-center gap-1"
                >
                  Welcome back, {firstName}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow-md z-10">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </div>
      </div>

      {showNav && mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-md">
          <nav className="flex flex-col px-4 py-2">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => { handleLogout(); }}
              className="text-left px-3 py-3 text-sm font-medium text-red-600 hover:bg-gray-100 rounded-md"
            >
              Log out
            </button>
          </nav>
        </div>
      )}
    </nav>
  );
}