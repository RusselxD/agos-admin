import { useState, useRef, useEffect, useCallback } from "react";
import { requestAnalysis, readAnalysisStream, type AnalysisPayload } from "../lib/api/analysis";

export type { AnalysisPayload } from "../lib/api/analysis";
export type AnalysisStatus = "idle" | "loading" | "streaming" | "done" | "error";

export function useAnalysisStream() {
    const [text, setText] = useState("");
    const [status, setStatus] = useState<AnalysisStatus>("idle");
    const [error, setError] = useState("");
    const abortRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortRef.current?.abort();
        };
    }, []);

    const analyze = useCallback(async (payload: AnalysisPayload) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const isCurrent = () => isMountedRef.current &&
            abortRef.current === controller && !controller.signal.aborted;
        setText("");
        setError("");
        setStatus("loading");

        try {
            const response = await requestAnalysis(payload, controller.signal);
            if (!isCurrent()) {
                await response.body?.cancel();
                return;
            }
            setStatus("streaming");
            await readAnalysisStream(response, (chunk) => {
                if (isCurrent()) setText((prev) => prev + chunk);
            }, controller.signal);
            if (isCurrent()) setStatus("done");
        } catch (err) {
            if (isCurrent()) {
                setError(err instanceof Error ? err.message : "Failed to generate analysis.");
                setStatus("error");
            }
        }
    }, []);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setText("");
        setError("");
        setStatus("idle");
    }, []);

    return { text, status, error, analyze, reset };
}
