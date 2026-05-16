import { Link } from "react-router-dom";

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Track Transactions",
    description: "Log every income and expense in seconds and keep your finances organized effortlessly.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Visual Insights",
    description: "See where your money goes with clear charts and summaries across any time period.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Budget Smarter",
    description: "Set spending targets, monitor your progress, and build habits that grow your savings.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f7f8] flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <span className="inline-block mb-4 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-[#0A84FF]">
          Personal Finance, Simplified
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-2xl mb-5">
          Take control of your{" "}
          <span className="text-[#0A84FF]">financial future</span>
        </h1>
        <p className="text-lg text-[#6E6E6E] max-w-xl mb-8">
          FinanceTracker helps you monitor income, manage expenses, and make smarter budgeting decisions — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/signup"
            className="px-6 py-3 rounded-lg bg-[#0A84FF] text-white font-semibold text-base shadow hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-offset-2"
          >
            Get started free
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-base bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            Log in
          </Link>
        </div>
      </main>

      <section className="bg-white border-t border-gray-100 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Everything you need to stay on budget
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {features.map(({ icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col items-start bg-[#f7f7f8] rounded-xl p-6 shadow-sm"
              >
                <span className="mb-4 p-2 rounded-lg bg-blue-100 text-[#0A84FF]">
                  {icon}
                </span>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-[#6E6E6E] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-[#6E6E6E]">
        &copy; 2026 FinanceTracker. All rights reserved.
      </footer>
    </div>
  );
}
