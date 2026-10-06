import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { readAnalysisStream } from "../lib/api/analysis";
import { readingReportsAPI, reportErrorMessage } from "../lib/api/readingReports";
import type { ReadingReport, ReportRequest } from "../types/readingReport";
import type { DailySummary } from "../types/readingLogs";

export type AnalysisStatus = "idle" | "loading" | "streaming" | "done" | "error";

export function useAnalysisStream(onSnapshot: (summaries: DailySummary[]) => void) {
    const [text, setText] = useState("");
    const [status, setStatus] = useState<AnalysisStatus>("idle");
    const [error, setError] = useState("");
    const [report, setReport] = useState<ReadingReport | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const reportRef = useRef<ReadingReport | null>(null);
    const requestRef = useRef<{ key: string; id: string } | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const exportRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortRef.current?.abort();
            exportRef.current?.abort();
        };
    }, []);

    const analyze = useCallback(async (payload: ReportRequest) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const isCurrent = () => isMountedRef.current && abortRef.current === controller && !controller.signal.aborted;
        const key = `${payload.location_id}:${payload.start_date}:${payload.end_date}`;
        if (requestRef.current?.key !== key) {
            requestRef.current = { key, id: crypto.randomUUID() };
            reportRef.current = null;
            setReport(null);
        }
        setText(""); setError(""); setExportError(""); setStatus("loading");
        try {
            const saved = reportRef.current
                ? await readingReportsAPI.get(reportRef.current.id, controller.signal)
                : await readingReportsAPI.create(payload, requestRef.current.id, controller.signal);
            if (!isCurrent()) return;
            reportRef.current = saved;
            setReport(saved);
            onSnapshot(saved.summaries);
            if (saved.status === "complete") {
                setText(saved.analysis_text); setStatus("done"); return;
            }
            const response = await readingReportsAPI.stream(saved.id, controller.signal);
            if (!isCurrent()) { await response.body?.cancel(); return; }
            setStatus("streaming");
            await readAnalysisStream(response, (chunk) => {
                if (isCurrent()) setText((prev) => prev + chunk);
            }, controller.signal);
            // Only the persisted, complete result can enable PDF export.
            const completed = await readingReportsAPI.get(saved.id, controller.signal);
            if (!isCurrent()) return;
            if (completed.status !== "complete") throw new Error("The analysis has not finished saving. Please retry.");
            reportRef.current = completed;
            setReport(completed); setText(completed.analysis_text); setStatus("done");
        } catch (err) {
            const message = await reportErrorMessage(err);
            if (isCurrent()) { setError(message); setStatus("error"); }
        }
    }, [onSnapshot]);

    const cancel = useCallback(() => {
        if (abortRef.current && (status === "loading" || status === "streaming")) {
            abortRef.current.abort(); abortRef.current = null;
            setError("Analysis was stopped. Retry to complete the report."); setStatus("error");
        }
    }, [status]);

    const reset = useCallback(() => {
        abortRef.current?.abort(); abortRef.current = null;
        exportRef.current?.abort(); exportRef.current = null;
        reportRef.current = null; requestRef.current = null;
        setText(""); setError(""); setStatus("idle"); setReport(null);
        setIsExporting(false); setExportError("");
    }, []);

    const downloadPdf = useCallback(async () => {
        const saved = reportRef.current;
        if (!saved || saved.status !== "complete" || exportRef.current) return;
        const controller = new AbortController(); exportRef.current = controller;
        const isCurrent = () => isMountedRef.current && exportRef.current === controller && !controller.signal.aborted;
        setIsExporting(true); setExportError("");
        try {
            const blob = await readingReportsAPI.pdf(saved.id, controller.signal);
            if (!isCurrent()) return;
            if (!blob.size || blob.type !== "application/pdf") throw new Error("The PDF response was invalid. Please try again.");
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `AGOS_Reading_Report_${saved.start_date}_to_${saved.end_date}.pdf`;
            document.body.appendChild(link); link.click(); link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            const message = await reportErrorMessage(err);
            if (isCurrent()) setExportError(message);
        } finally {
            if (isCurrent()) { exportRef.current = null; setIsExporting(false); }
        }
    }, []);

    return useMemo(() => ({ text, status, error, report, isExporting, exportError, analyze, cancel, reset, downloadPdf }),
        [text, status, error, report, isExporting, exportError, analyze, cancel, reset, downloadPdf]);
}
