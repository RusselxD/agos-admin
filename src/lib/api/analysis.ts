import { expireAuthSession, refreshAccessToken } from "./axiosConfig";
import type { DailySummary } from "../../types/readingLogs";

export type AnalysisPayload = {
    start_date: string;
    end_date: string;
    summaries: DailySummary[];
};

export async function requestAnalysis(payload: AnalysisPayload, signal: AbortSignal) {
    return requestAnalysisStream("/daily-summaries", signal, payload);
}

export async function requestAnalysisStream(path: string, signal: AbortSignal, payload?: AnalysisPayload) {
    const send = () => fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/analysis${path}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify(payload),
            signal,
        },
    );
    let response = await send();
    if (response.status === 401) {
        await response.body?.cancel();
        await refreshAccessToken();
        signal.throwIfAborted();
        response = await send();
        if (response.status === 401) expireAuthSession();
    }
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(typeof data?.detail === "string" ? data.detail : "Failed to generate analysis. Please try again.");
    }
    return response;
}

export async function readAnalysisStream(
    response: Response,
    onText: (text: string) => void,
    signal: AbortSignal,
) {
    if (!response.body) throw new Error("No analysis response was received.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const parseLine = (line: string) => {
        if (!line.startsWith("data:")) return false;
        const event = JSON.parse(line.slice(5).trim());
        if (event.error) throw new Error(String(event.error));
        if (typeof event.text === "string") onText(event.text);
        return event.done === true;
    };
    try {
        while (true) {
            signal.throwIfAborted();
            const { done, value } = await reader.read();
            signal.throwIfAborted();
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
            let newline: number;
            while ((newline = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, newline).replace(/\r$/, "");
                buffer = buffer.slice(newline + 1);
                if (parseLine(line)) return;
            }
            if (done) {
                if (buffer.trim() && parseLine(buffer)) return;
                throw new Error("AI analysis was interrupted. Please try again.");
            }
        }
    } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
    }
}
