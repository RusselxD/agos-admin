import {
    createContext,
    useContext,
    useState,
    useMemo,
    useEffect,
    useRef,
} from "react";
import { useAnalysisStream } from "../../../hooks/useAnalysisStream";
import type { DailySummary } from "../../../types/readingLogs";
import { readingLogsAPI } from "../../../lib/api/readingLogs";
import { useCoreHook } from "../../../context/CoreContext";
import { getDefaultSummaryRange } from "../../../lib/utils/readingLogs";
import { useToast } from "../../../context/ToastContext";

interface ReadingLogsContextValue {
    analysis: ReturnType<typeof useAnalysisStream>;
    locationId: number;
    startDate: string;
    endDate: string;
    availableDays: string[];
    analyzeDrawerIsOpen: boolean;
    summaries: DailySummary[];
    isLoading: boolean;

    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    setAnalyzeDrawerIsOpen: (isOpen: boolean) => void;
    selectedSummary: DailySummary | null;
    setSelectedSummary: (summary: DailySummary | null) => void;
}

const ReadingLogsContext = createContext<ReadingLogsContextValue | undefined>(
    undefined,
);

export function ReadingLogsProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [availableDays, setAvailableDays] = useState<string[]>([]);

    const [summaries, setSummaries] = useState<DailySummary[]>([]);
    const analysis = useAnalysisStream(setSummaries);
    const { reset: resetAnalysis } = analysis;
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [rangeLocationId, setRangeLocationId] = useState<number | null>(null);

    const { locationDetails } = useCoreHook();
    const { toastError } = useToast();

    const [analyzeDrawerIsOpen, setAnalyzeDrawerIsOpen] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);

    // ToastContext callbacks may change on unrelated parent renders.
    const toastErrorRef = useRef(toastError);
    useEffect(() => { toastErrorRef.current = toastError; }, [toastError]);

    useEffect(() => {
        let cancelled = false;
        resetAnalysis();
        setRangeLocationId(null);
        setAvailableDays([]);
        setSummaries([]);
        setStartDate("");
        setEndDate("");
        setSelectedSummary(null);
        setAnalyzeDrawerIsOpen(false);
        setIsLoading(true);
        if (!locationDetails.location_id) return;

        const initialize = async () => {
            try {
                const days = await readingLogsAPI.getAvailableDays(locationDetails.location_id);
                if (cancelled) return;
                const range = getDefaultSummaryRange(days);
                setAvailableDays(range.days);
                setStartDate(range.startDate);
                setEndDate(range.endDate);
                setRangeLocationId(locationDetails.location_id);
                if (!range.days.length) setIsLoading(false);
            } catch {
                if (!cancelled) {
                    toastErrorRef.current("Failed to fetch reading logs");
                    setIsLoading(false);
                }
            }
        };
        void initialize();
        return () => { cancelled = true; };
    }, [locationDetails.location_id, resetAnalysis]);

    useEffect(() => {
        if (rangeLocationId !== locationDetails.location_id || !startDate || !endDate) return;
        let cancelled = false;
        resetAnalysis();
        setIsLoading(true);
        setSummaries([]);
        setSelectedSummary(null);
        setAnalyzeDrawerIsOpen(false);
        const fetchSummaries = async () => {
            try {
                const data = await readingLogsAPI.getDailySummaries(
                    locationDetails.location_id, startDate, endDate,
                );
                if (!cancelled) setSummaries(data);
            } catch {
                if (!cancelled) toastErrorRef.current("Failed to fetch reading logs");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void fetchSummaries();
        return () => { cancelled = true; };
    }, [startDate, endDate, locationDetails.location_id, rangeLocationId, resetAnalysis]);

    const contextValue = useMemo(
        () => ({
            analysis,
            locationId: locationDetails.location_id,
            summaries,
            isLoading,
            startDate,
            endDate,
            availableDays,
            analyzeDrawerIsOpen,
            selectedSummary,
            setStartDate,
            setEndDate,
            setAnalyzeDrawerIsOpen,
            setSelectedSummary,
        }),
        [
            analysis,
            locationDetails.location_id,
            summaries,
            isLoading,
            startDate,
            endDate,
            availableDays,
            analyzeDrawerIsOpen,
            selectedSummary,
        ],
    );

    return (
        <ReadingLogsContext.Provider value={contextValue}>
            {children}
        </ReadingLogsContext.Provider>
    );
}

// Context providers and their consumer hook intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export const useReadingLogs = () => {
    const context = useContext(ReadingLogsContext);
    if (context === undefined) {
        throw new Error(
            "useReadingLogs must be used within a ReadingLogsProvider",
        );
    }
    return context;
};
