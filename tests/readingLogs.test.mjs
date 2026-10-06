import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Use Vite's installed transformer dependency; no additional test framework.
const require = createRequire(import.meta.url);
const { buildSync } = createRequire(require.resolve("vite"))("esbuild");
const bundled = buildSync({
    stdin: {
        contents: `export * from "./src/lib/utils/readingLogs";
            export * from "./src/lib/api/analysis";
            export * from "./src/lib/api/readingReports";
            export * from "./src/lib/api/axiosConfig";
            export { default as apiClient } from "./src/lib/api/axiosConfig";
            export { default as axios } from "axios";`,
        resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    },
    bundle: true, write: false, format: "esm", platform: "browser",
    define: { "import.meta.env.VITE_API_BASE_URL": '"http://agos.test"' },
});
const {
    getDefaultSummaryRange, getSummaryStats, readAnalysisStream, requestAnalysis,
    resetRefreshState, refreshAccessToken, axios, apiClient, readingReportsAPI, reportErrorMessage,
} = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
const originalFetch = globalThis.fetch;
const originalAdapter = axios.defaults.adapter;
beforeEach(() => {
    const values = new Map([["authToken", "expired"], ["refreshToken", "refresh"]]);
    globalThis.localStorage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
    };
    globalThis.window = { location: { pathname: "/reading-logs", href: "/reading-logs" } };
    resetRefreshState();
});
afterEach(() => {
    globalThis.fetch = originalFetch;
    axios.defaults.adapter = originalAdapter;
    delete globalThis.localStorage;
    delete globalThis.window;
});

const payload = { start_date: "2026-10-01", end_date: "2026-10-02", summaries: [] };
const emptySummary = {
    summary_date: "2026-10-01", max_risk_score: null,
    max_water_level_cm: null, max_precipitation_mm: null, most_severe_blockage: null,
};
const response = (chunks) => new Response(new ReadableStream({
    start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
    },
}));

test("default range selects the latest ten distinct dates regardless of input order", () => {
    const days = Array.from({ length: 15 }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00`);
    const range = getDefaultSummaryRange([...days.reverse(), days[0]]);
    assert.equal(range.startDate, "2026-09-06");
    assert.equal(range.endDate, "2026-09-15");
    assert.equal(range.days.length, 15);
    assert.equal(getDefaultSummaryRange([]).startDate, "");
});

test("missing metrics are excluded while real zero readings retain their date", () => {
    const stats = getSummaryStats([
        emptySummary,
        { ...emptySummary, summary_date: "2026-10-02", max_risk_score: 0,
            max_water_level_cm: 0, max_precipitation_mm: 0, most_severe_blockage: "clear" },
        { ...emptySummary, max_precipitation_mm: 8, most_severe_blockage: "blocked" },
    ]);
    assert.deepEqual(stats.highestRisk, { value: 0, date: "2026-10-02" });
    assert.deepEqual(stats.peakWaterLevel, { value: 0, date: "2026-10-02" });
    assert.equal(stats.avgDailyPeakPrecipitation, 4);
    assert.equal(stats.precipDays, 2);
    assert.equal(stats.blockageDays, 2);
    assert.equal(stats.blockedDays, 1);
    assert.equal(getSummaryStats([emptySummary]).avgDailyPeakPrecipitation, null);
    assert.equal(getSummaryStats([]).highestRisk, null);
});

test("SSE parses split frames, CRLF, and a terminal frame without a newline", async () => {
    let text = "";
    await readAnalysisStream(response([
        'data: {"te', 'xt":"Water ↑"}\r\n\r\n', 'data:{"text":" steady"}\n', 'data: {"done":true}',
    ]), (chunk) => { text += chunk; }, new AbortController().signal);
    assert.equal(text, "Water ↑ steady");
});

test("SSE provider errors override done and preserve text already received", async () => {
    let text = "";
    await assert.rejects(readAnalysisStream(response([
        'data: {"text":"Partial analysis"}\n\n',
        'data: {"error":"Provider unavailable","done":true}\n\n',
    ]), (chunk) => { text += chunk; }, new AbortController().signal), /Provider unavailable/);
    assert.equal(text, "Partial analysis");
});

test("a truncated SSE stream reports interruption instead of remaining streaming", async () => {
    await assert.rejects(readAnalysisStream(response(['data: {"text":"Partial"}\n\n']),
        () => {}, new AbortController().signal), /interrupted/);
});

test("expired AI token refreshes and retries with the new token", async () => {
    let refreshes = 0;
    const authHeaders = [];
    axios.defaults.adapter = async (config) => {
        refreshes++;
        assert.equal(config.url, "http://agos.test/api/v1/auth/refresh");
        return { data: { access_token: "fresh", refresh_token: "rotated" }, status: 200, config };
    };
    globalThis.fetch = async (_, options) => {
        authHeaders.push(options.headers.Authorization);
        return authHeaders.length === 1 ? new Response(null, { status: 401 }) : response(['data: {"done":true}\n\n']);
    };
    assert.equal((await requestAnalysis(payload, new AbortController().signal)).status, 200);
    assert.deepEqual(authHeaders, ["Bearer expired", "Bearer fresh"]);
    assert.equal(refreshes, 1);
    assert.equal(localStorage.getItem("refreshToken"), "rotated");
});

test("concurrent streaming and Axios requests share one token refresh", async () => {
    let refreshes = 0;
    axios.defaults.adapter = async (config) => {
        refreshes++;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { data: { access_token: "fresh", refresh_token: "rotated" }, status: 200, config };
    };
    globalThis.fetch = async (_, options) => options.headers.Authorization === "Bearer expired"
        ? new Response(null, { status: 401 }) : response(['data: {"done":true}\n\n']);
    const oldAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = async (config) => {
        if (config.headers.Authorization === "Bearer expired") {
            throw { config, response: { status: 401 } };
        }
        return { data: "ok", status: 200, config };
    };
    try {
        const results = await Promise.all([
            requestAnalysis(payload, new AbortController().signal), apiClient.get("/daily-summaries"),
        ]);
        assert.equal(refreshes, 1);
        assert.equal(results[1].data, "ok");
    } finally { apiClient.defaults.adapter = oldAdapter; }
});

test("failed refresh clears auth tokens and redirects to login", async () => {
    axios.defaults.adapter = async () => { throw new Error("expired refresh"); };
    await assert.rejects(refreshAccessToken(), /session has expired/);
    assert.equal(localStorage.getItem("authToken"), null);
    assert.equal(window.location.href, "/auth/login");
});

test("closing analysis during refresh prevents another AI request", async () => {
    const controller = new AbortController();
    let requests = 0;
    axios.defaults.adapter = async (config) => {
        controller.abort();
        return { data: { access_token: "fresh", refresh_token: "rotated" }, status: 200, config };
    };
    globalThis.fetch = async () => { requests++; return new Response(null, { status: 401 }); };
    await assert.rejects(requestAnalysis(payload, controller.signal), { name: "AbortError" });
    assert.equal(requests, 1);
});


test("report creation sends only the requested range and reuses its idempotency ID", async () => {
    const previous = apiClient.defaults.adapter;
    const bodies = [];
    apiClient.defaults.adapter = async (config) => {
        assert.equal(config.url, "/analysis/reports");
        bodies.push(JSON.parse(config.data));
        return { data: { id: "saved-report" }, status: 201, config };
    };
    try {
        const requested = { ...payload, location_id: 1, summaries: [{ fabricated: true }] };
        await readingReportsAPI.create(requested, "request-id", new AbortController().signal);
        await readingReportsAPI.create(requested, "request-id", new AbortController().signal);
        assert.deepEqual(bodies[0], { location_id: 1, start_date: payload.start_date,
            end_date: payload.end_date, request_id: "request-id" });
        assert.deepEqual(bodies[1], bodies[0]);
    } finally { apiClient.defaults.adapter = previous; }
});

test("report AI streams from the saved report ID with no browser summaries", async () => {
    globalThis.fetch = async (url, config) => {
        assert.equal(url, "http://agos.test/api/v1/analysis/reports/saved-report/stream");
        assert.equal(config.body, undefined);
        assert.equal(config.headers.Authorization, "Bearer expired");
        return response(['data: {"done":true}\n\n']);
    };
    assert.equal((await readingReportsAPI.stream("saved-report", new AbortController().signal)).status, 200);
});

test("PDF requests retain auth, blob download and a rendering timeout", async () => {
    const previous = apiClient.defaults.adapter;
    apiClient.defaults.adapter = async (config) => {
        assert.equal(config.url, "/analysis/reports/saved-report/pdf");
        assert.equal(config.responseType, "blob");
        assert.equal(config.timeout, 120000);
        assert.equal(config.headers.Authorization, "Bearer expired");
        return { data: new Blob(["%PDF-test"], { type: "application/pdf" }), status: 200, config };
    };
    try {
        assert.equal((await readingReportsAPI.pdf("saved-report", new AbortController().signal)).type, "application/pdf");
    } finally { apiClient.defaults.adapter = previous; }
});

test("PDF errors encoded as blobs remain useful retry messages", async () => {
    const error = { isAxiosError: true, response: { data: new Blob([
        JSON.stringify({ detail: "PDF generation is busy. Please retry shortly." }),
    ], { type: "application/json" }) } };
    assert.equal(await reportErrorMessage(error), "PDF generation is busy. Please retry shortly.");
});
