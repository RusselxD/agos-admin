import { ArrowRight } from "lucide-react";
import type { ElementType } from "react";

interface CompactMetricCardProps {
    icon: ElementType;
    label: string;
    minValue: number | null;
    maxValue: number | null;
    unit: string;
    iconColor: string;
}

export default function CompactMetricCard({
    icon: Icon,
    label,
    minValue,
    maxValue,
    unit,
    iconColor,
}: CompactMetricCardProps) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/50 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${iconColor} dark:bg-opacity-20`}>
                    <Icon className={`w-4 h-4 text-white ${iconColor.replace('bg-', 'text-')} dark:!text-white`} />
                </div>
                <span className="text-sm font-medium text-neutral dark:text-slate-200">
                    {label}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <div className="text-center">
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Min</p>
                    <p className="text-lg font-semibold text-neutral dark:text-slate-200">
                        {minValue ?? "N/A"}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">{unit}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                <div className="text-center">
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Max</p>
                    <p className="text-lg font-semibold text-neutral dark:text-slate-200">
                        {maxValue ?? "N/A"}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">{unit}</p>
                </div>
            </div>
        </div>
    );
}
