import { useEffect, useRef } from "react";
import { useReadingLogs } from "../../context/ReadingLogsContext";
import { Download, LoaderCircle } from "lucide-react";
import MarkdownText from "./components/MarkDownText";
import Header from "./components/Header";

function Shimmer() {
    return (
        <div className="flex flex-col gap-2.5 p-4">
            {[95, 75, 88, 60, 72, 83, 55].map((w, i) => (
                <div
                    key={i}
                    className="h-3 rounded-md bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse"
                    style={{ width: `${w}%` }}
                />
            ))}
        </div>
    );
}

export default function AnalyzePanel() {
    const { setAnalyzeDrawerIsOpen, locationId, analysis, startDate, endDate } =
        useReadingLogs();
    const { text, status, error, analyze, cancel, report, downloadPdf, isExporting, exportError } = analysis;
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll as text streams in
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [text]);

    // The provider retains the completed report when the drawer is closed.
    useEffect(() => {
        if (status === "idle") void analyze({ location_id: locationId, start_date: startDate, end_date: endDate });
    }, [analyze, status, locationId, startDate, endDate]);

    const handleClose = () => {
        cancel();
        setAnalyzeDrawerIsOpen(false);
    };

    const isLoading = status === "loading";
    const isStreaming = status === "streaming";
    const isDone = status === "done";
    const isError = status === "error";

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 dark:bg-black/60 z-40 transition-opacity duration-300"
                onClick={handleClose}
            />

            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border-l border-white/10 dark:border-slate-800 shadow-2xl z-50 flex flex-col animate-slide-in-right">
                <Header
                    startDate={startDate}
                    endDate={endDate}
                    isLoading={isLoading}
                    isStreaming={isStreaming}
                    isDone={isDone}
                    isError={isError}
                    handleClose={handleClose}
                />

                {report && (
                    <div className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <p>{report.location_name} · {report.summaries.length} observed days · {report.timezone}</p>
                        {report.missing_dates.length > 0 && <p>{report.missing_dates.length} days have no summary.</p>}
                        {!!report.partial_dates?.length && (
                            <p className="mt-1 text-amber-700 dark:text-amber-400">
                                Partial day: {report.partial_dates.join(", ")}. Its saved summary may cover only part of the day.
                            </p>
                        )}
                        <p>Data captured: {new Date(Date.parse(report.created_at) + report.utc_offset_hours * 3600000)
                            .toLocaleString("en-PH", { timeZone: "UTC", hour12: false })} {report.timezone}</p>
                    </div>
                )}
                {/* Scrollable content */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Shimmer while loading */}
                    {isLoading && <Shimmer />}

                    {/* AI analysis bubble */}
                    {(isStreaming || isDone || isError) && text && (
                        <div className="flex gap-2.5 items-start">
                            <div className="flex-1 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 px-4 py-2 shadow-sm text-gray-800 dark:text-slate-200">
                                <MarkdownText
                                    text={text}
                                    showCursor={isStreaming}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {isError && (
                        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {error || "Failed to generate analysis."}
                            </p>
                            <button
                                onClick={() =>
                                    analyze({
                                        start_date: startDate,
                                        end_date: endDate,
                                        location_id: locationId,
                                    })
                                }
                                className="text-xs text-sky-600 font-medium hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                </div>
                {isDone && report?.status === "complete" && (
                    <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800">
                        <button disabled={isExporting} onClick={() => void downloadPdf()}
                            className="w-full flex justify-center items-center gap-2 rounded-lg bg-sky-600 text-white py-2.5 text-sm font-medium hover:bg-sky-700 disabled:opacity-60">
                            {isExporting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {isExporting ? "Preparing PDF…" : "Download PDF report"}
                        </button>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Includes the selected dates, charts, daily readings, and this AI overview.</p>
                        {exportError && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{exportError}</p>}
                    </div>
                )}
            </div>
        </>
    );
}
