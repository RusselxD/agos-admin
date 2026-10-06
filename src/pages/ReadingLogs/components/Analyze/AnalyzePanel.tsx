import { useEffect, useRef } from "react";
import { useReadingLogs } from "../../context/ReadingLogsContext";
import { useAnalysisStream } from "../../../../hooks/useAnalysisStream";
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
    const { setAnalyzeDrawerIsOpen, summaries, startDate, endDate } =
        useReadingLogs();
    const { text, status, error, analyze, reset } = useAnalysisStream();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll as text streams in
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [text]);

    // Kick off analysis as soon as the drawer mounts
    useEffect(() => {
        analyze({
            start_date: startDate,
            end_date: endDate,
            summaries,
        });

        // Cancel the stream if the drawer is closed mid-generation
        return () => reset();
    }, [analyze, reset, startDate, endDate, summaries]);

    const handleClose = () => {
        reset();
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
                                        summaries,
                                    })
                                }
                                className="text-xs text-sky-600 font-medium hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
