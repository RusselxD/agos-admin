import { TrendingDown, TrendingUp } from "lucide-react";
import { formatTimestamp } from "../../../../../../lib/utils/formatter";
import type { ElementType } from "react";

interface ValueContainerProps {
    textClass: string;
    value: number | null;
    timestamp: string | null;
    Icon: ElementType;
    label: string;
}

const ValueContainer = ({
    textClass,
    value,
    timestamp,
    Icon,
    label,
}: ValueContainerProps) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
            </div>

            <div className="text-right">
                <span className={`text-xl font-bold ${textClass}`}>
                    {value ?? "N/A"}
                </span>

                <p className="text-xs text-gray-700 dark:text-slate-300">
                    {timestamp ? formatTimestamp(timestamp) : "N/A"}
                </p>
            </div>
        </div>
    );
};

interface HeroMetricCardProps {
    icon: ElementType;
    label: string;
    minValue: number | null;
    maxValue: number | null;
    minTimestamp: string | null;
    maxTimestamp: string | null;
    gradient: string;
    textClass: string;
    borderClass: string;
    bgClass: string;
    progressClass: string;
    blurClass: string;
}

export default function HeroMetricCard({
    icon: Icon,
    label,
    minValue,
    maxValue,
    minTimestamp,
    maxTimestamp,
    gradient,
    textClass,
    borderClass,
    bgClass,
    progressClass,
    blurClass,
}: HeroMetricCardProps) {
    const percentage = maxValue !== null && maxValue > 0 ? Math.min((maxValue / 100) * 100, 100) : 0;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-3 border ${borderClass}`}
        >
            <div
                className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${blurClass} blur-2xl`}
            />

            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${bgClass} dark:bg-opacity-20`}>
                        <Icon className={`w-5 h-5 ${textClass} dark:opacity-90`} />
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-slate-200 uppercase tracking-wider">
                        {label}
                    </span>
                </div>

                <div className="space-y-3">
                    {/* Min Value */}
                    <ValueContainer
                        textClass={textClass}
                        value={minValue}
                        timestamp={minTimestamp}
                        Icon={TrendingDown}
                        label="Min"
                    ></ValueContainer>

                    {/* Progress bar showing range */}
                    <div className="relative h-2 bg-gray-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                            className={`absolute left-0 top-0 h-full bg-gradient-to-r ${progressClass} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {/* Max Value */}
                    <ValueContainer
                        textClass={textClass}
                        value={maxValue}
                        timestamp={maxTimestamp}
                        Icon={TrendingUp}
                        label="Max"
                    ></ValueContainer>
                </div>
            </div>
        </div>
    );
}
