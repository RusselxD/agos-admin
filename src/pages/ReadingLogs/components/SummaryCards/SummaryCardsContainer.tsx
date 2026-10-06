import { AlertTriangle, CloudRain, ShieldAlert, Waves } from "lucide-react";
import { useMemo } from "react";
import StatCard from "./StatCard";
import { getSummaryStats } from "../../../../lib/utils/readingLogs";
import { useReadingLogs } from "../../context/ReadingLogsContext";
import { formatDate } from "../../../../lib/utils/formatter";

export default function SummaryCardsContainer() {
    const { summaries, isLoading, analysis } = useReadingLogs();

    const stats = useMemo(() => analysis.report?.stats ?? getSummaryStats(summaries), [summaries, analysis.report]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-800 custom-shadow rounded-xl p-4 h-24 border border-gray-100 dark:border-slate-700/50"
                    >
                        <div className="skeleton h-full rounded-md"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <StatCard
                icon={AlertTriangle}
                label="Highest Risk Score"
                value={stats.highestRisk?.value ?? "N/A"}
                subValue={stats.highestRisk ? formatDate(stats.highestRisk.date) : "No risk readings"}
                colorClass="text-blocked dark:text-red-400"
                bgColorClass="bg-blocked/10 dark:bg-red-950/20"
            />
            <StatCard
                icon={Waves}
                label="Peak Water Level"
                value={stats.peakWaterLevel ? `${stats.peakWaterLevel.value} cm` : "N/A"}
                subValue={stats.peakWaterLevel ? formatDate(stats.peakWaterLevel.date) : "No water readings"}
                colorClass="text-blue-600 dark:text-indigo-400"
                bgColorClass="bg-blue-100 dark:bg-indigo-950/30"
            />
            <StatCard
                icon={CloudRain}
                label="Average Daily Peak Precipitation"
                value={stats.avgDailyPeakPrecipitation === null ? "N/A" : `${stats.avgDailyPeakPrecipitation.toFixed(1)} mm`}
                subValue={`Across ${stats.precipDays} observed days`}
                colorClass="text-primary dark:text-sky-400"
                bgColorClass="bg-primary/10 dark:bg-sky-950/30"
            />
            <StatCard
                icon={ShieldAlert}
                label="Days with Potential Obstruction"
                value={stats.blockageDays ? stats.blockedDays : "N/A"}
                subValue={`of ${stats.blockageDays} observed days`}
                colorClass="text-partial dark:text-amber-400"
                bgColorClass="bg-partial/10 dark:bg-amber-950/20"
            />
        </div>
    );
}
