import type { DailySummary } from "../../types/readingLogs";

export function getDefaultSummaryRange(days: string[]) {
    const sorted = [...new Set(days.map((day) => day.slice(0, 10)))].sort();
    return {
        days: sorted,
        startDate: sorted[Math.max(0, sorted.length - 10)] ?? "",
        endDate: sorted.at(-1) ?? "",
    };
}

export function getSummaryStats(summaries: DailySummary[]) {
    let highestRisk: { value: number; date: string } | null = null;
    let peakWaterLevel: { value: number; date: string } | null = null;
    let totalPrecip = 0;
    let precipDays = 0;
    let blockageDays = 0;
    let blockedDays = 0;

    for (const summary of summaries) {
        if (summary.max_risk_score !== null &&
            (!highestRisk || summary.max_risk_score > highestRisk.value)) {
            highestRisk = { value: summary.max_risk_score, date: summary.summary_date };
        }
        if (summary.max_water_level_cm !== null &&
            (!peakWaterLevel || summary.max_water_level_cm > peakWaterLevel.value)) {
            peakWaterLevel = { value: summary.max_water_level_cm, date: summary.summary_date };
        }
        if (summary.max_precipitation_mm !== null) {
            totalPrecip += summary.max_precipitation_mm;
            precipDays++;
        }
        if (summary.most_severe_blockage !== null) {
            blockageDays++;
            if (summary.most_severe_blockage.toLowerCase() === "blocked") blockedDays++;
        }
    }
    return {
        highestRisk,
        peakWaterLevel,
        avgDailyPeakPrecipitation: precipDays ? totalPrecip / precipDays : null,
        precipDays,
        blockageDays,
        blockedDays,
    };
}
