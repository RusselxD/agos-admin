import axios from "axios";
import apiClient from "./axiosConfig";
import { requestAnalysisStream } from "./analysis";
import type { ReadingReport, ReportRequest } from "../../types/readingReport";

export const readingReportsAPI = {
    async create(request: ReportRequest, requestId: string, signal: AbortSignal) {
        const { data } = await apiClient.post<ReadingReport>("/analysis/reports", {
            location_id: request.location_id, start_date: request.start_date,
            end_date: request.end_date, request_id: requestId,
        }, { signal });
        return data;
    },
    async get(id: string, signal: AbortSignal) {
        return (await apiClient.get<ReadingReport>(`/analysis/reports/${id}`, { signal })).data;
    },
    stream(id: string, signal: AbortSignal) {
        return requestAnalysisStream(`/reports/${id}/stream`, signal);
    },
    async pdf(id: string, signal: AbortSignal) {
        return (await apiClient.get<Blob>(`/analysis/reports/${id}/pdf`, {
            responseType: "blob", timeout: 120000, signal,
        })).data;
    },
};

export async function reportErrorMessage(error: unknown): Promise<string> {
    if (axios.isAxiosError(error)) {
        let data = error.response?.data;
        if (data instanceof Blob) {
            try { data = JSON.parse(await data.text()); } catch { data = null; }
        }
        if (typeof data?.detail === "string") return data.detail;
        if (Array.isArray(data?.detail)) return data.detail.map((item: { msg: string }) => item.msg).join(". ");
        if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    }
    return error instanceof Error ? error.message : "Could not prepare the report. Please try again.";
}
