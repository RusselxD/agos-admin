import { formatDate } from "../../../../lib/utils/formatter";
import type { DailySummary } from "../../../../types/readingLogs";
import { getSurfaceObstructionLabel } from "../../../../lib/utils/obstruction";

interface TableRowProps {
    summary: DailySummary;
    index: number;
    onSelect: (summary: DailySummary) => void;
}

const BlockageBadge = ({ status }: { status: string | null }) => {
    if (!status) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400">N/A</span>;
    const normalized = status.toLowerCase();
    let bgColor = "bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400";

    if (normalized === "clear") {
        bgColor = "bg-clear/15 dark:bg-emerald-900/20 text-clear dark:text-emerald-400 ring-1 ring-clear/20 dark:ring-emerald-800/50";
    } else if (normalized === "partial") {
        bgColor = "bg-partial/15 dark:bg-amber-900/20 text-partial dark:text-amber-400 ring-1 ring-partial/20 dark:ring-amber-800/50";
    } else if (normalized === "blocked") {
        bgColor = "bg-blocked/15 dark:bg-red-900/20 text-blocked dark:text-red-400 ring-1 ring-blocked/20 dark:ring-red-800/50";
    }

    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}
        >
            {getSurfaceObstructionLabel(status)}
        </span>
    );
};

const RiskBadge = ({ score }: { score: number | null }) => {
    if (score === null) return <span className="text-gray-400 dark:text-slate-500">N/A</span>;
    let bgColor = "bg-clear/15 dark:bg-emerald-900/20 text-clear dark:text-emerald-400 ring-1 ring-clear/20 dark:ring-emerald-800/50";

    if (score >= 70) {
        bgColor = "bg-blocked/15 dark:bg-red-900/20 text-blocked dark:text-red-400 ring-1 ring-blocked/20 dark:ring-red-800/50";
    } else if (score >= 40) {
        bgColor = "bg-partial/15 dark:bg-amber-900/20 text-partial dark:text-amber-400 ring-1 ring-partial/20 dark:ring-amber-800/50";
    }

    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}
        >
            {score}
        </span>
    );
};

export default function TableRow({ summary, index, onSelect }: TableRowProps) {
    return (
        <tr
            onClick={() => onSelect(summary)}
            className={`${index % 2 !== 0 ? "bg-gray-50/50 dark:bg-white/[0.01]" : "bg-white/40 dark:bg-transparent"} text-gray-700 dark:text-slate-200 transition-colors hover:bg-gray-100/50 dark:hover:bg-white/[0.03] cursor-pointer`}
        >
            <td className="px-5 py-4 text-left font-medium text-neutral dark:text-slate-200 whitespace-nowrap">
                {formatDate(summary.summary_date)}
            </td>
            <td className="px-5 py-4 text-left">
                <div className="flex items-center gap-2">
                    <RiskBadge score={summary.min_risk_score} />
                    <span className="text-gray-400 dark:text-slate-500">→</span>
                    <RiskBadge score={summary.max_risk_score} />
                </div>
            </td>
            <td className="px-5 py-4 text-left whitespace-nowrap">
                <span className="text-sm">
                    {summary.min_water_level_cm ?? "N/A"} - {summary.max_water_level_cm ?? "N/A"}{" "}
                    cm
                </span>
            </td>
            <td className="px-5 py-4 text-left whitespace-nowrap">
                <span className="text-sm">
                    {summary.min_precipitation_mm ?? "N/A"} -{" "}
                    {summary.max_precipitation_mm ?? "N/A"} mm
                </span>
            </td>
            <td className="px-5 py-4 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                    <BlockageBadge status={summary.least_severe_blockage} />
                    {summary.least_severe_blockage !==
                        summary.most_severe_blockage && (
                        <>
                            <span className="text-gray-400 dark:text-slate-500">→</span>
                            <BlockageBadge
                                status={summary.most_severe_blockage}
                            />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
