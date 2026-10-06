import { Sparkles } from "lucide-react";
import { useReadingLogs } from "../context/ReadingLogsContext";
import DateRangePicker from "./DataTable/DateRangePicker";

export default function Header() {
    const { setAnalyzeDrawerIsOpen, isLoading, summaries } = useReadingLogs();

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl py-4 px-6 rounded-2xl shadow-xl border border-white/50 dark:border-white/10 transition-all duration-300 hover:shadow-2xl">
            {/* Mobile Top Row: Title + Analyze Button */}
            <div className="flex items-center justify-between w-full md:w-auto">
                <h2 className="font-semibold text-lg whitespace-nowrap dark:text-slate-200">Daily Summaries</h2>
                
                <button
                    className="gemini-btn md:hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || summaries.length === 0}
                    onClick={() => setAnalyzeDrawerIsOpen(true)}
                >
                    <Sparkles className="gemini-btn-icon w-4 h-4" />
                    <span className="relative z-10">Analyze</span>
                </button>
            </div>

            {/* Bottom Row / Desktop Right Side: Date Picker + Desktop Analyze Button */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-full">
                    <DateRangePicker />
                </div>
                
                <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-slate-700" />
                <button
                    className="gemini-btn hidden md:flex disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || summaries.length === 0}
                    onClick={() => setAnalyzeDrawerIsOpen(true)}
                >
                    <Sparkles className="gemini-btn-icon w-4 h-4" />
                    <span className="relative z-10">Analyze</span>
                </button>
            </div>
        </div>
    );
}
