import type { DailySummary } from "./readingLogs";
import type { getSummaryStats } from "../lib/utils/readingLogs";

export type ReportRequest = { location_id: number; start_date: string; end_date: string };
export type ReadingReport = ReportRequest & {
    id: string;
    location_name: string;
    created_at: string;
    expires_at: string;
    timezone: string;
    utc_offset_hours: number;
    summaries: DailySummary[];
    missing_dates: string[];
    status: "pending" | "streaming" | "complete" | "error";
    analysis_text: string;
    analysis_error: string | null;
    analysis_completed_at: string | null;
    analysis_model: string | null;
    data_hash: string;
    stats: ReturnType<typeof getSummaryStats>;
};
