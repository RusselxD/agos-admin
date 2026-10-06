import { AlertTriangle, Droplets, CloudRain } from "lucide-react";
import type { DailySummary } from "../../../../../types/readingLogs";
import HeroMetricCard from "./components/HeroMetricCard";
import Header from "./components/Header";
import WeatherCard from "./components/WeatherCard";
import CompactMetricCard from "./components/CompactMetricCard";
import BlockageCard from "./components/BlockageCard";
import { useEffect } from "react";

interface DayDetailPanelProps {
    summary: DailySummary;
    onClose: () => void;
}

export type RiskLevelConfig = {
    label: string;
    color: string;
    bgGradient: string;
    textClass: string;
    borderClass: string;
    bgClass: string;
    dotClass: string;
    badgeBgClass: string;
    badgeBorderClass: string;
    progressClass: string;
    blurClass: string;
};

const getRiskLevel = (score: number | null): RiskLevelConfig => {
    if (score === null) return {
        label: "Unknown", color: "gray", bgGradient: "from-gray-100 to-gray-50",
        textClass: "text-gray-500", borderClass: "border-gray-200",
        bgClass: "bg-gray-100", dotClass: "bg-gray-400",
        badgeBgClass: "bg-gray-100", badgeBorderClass: "border-gray-200",
        progressClass: "from-gray-300 to-gray-400", blurClass: "bg-gray-100",
    };
    if (score >= 70)
        return {
            label: "High",
            color: "blocked",
            bgGradient: "from-blocked/20 to-blocked/5",
            textClass: "text-blocked",
            borderClass: "border-blocked/20",
            bgClass: "bg-blocked/15",
            dotClass: "bg-blocked",
            badgeBgClass: "bg-blocked/10",
            badgeBorderClass: "border-blocked/20",
            progressClass: "from-blocked/60 to-blocked",
            blurClass: "bg-blocked/10",
        };
    if (score >= 40)
        return {
            label: "Medium",
            color: "partial",
            bgGradient: "from-partial/20 to-partial/5",
            textClass: "text-partial",
            borderClass: "border-partial/20",
            bgClass: "bg-partial/15",
            dotClass: "bg-partial",
            badgeBgClass: "bg-partial/10",
            badgeBorderClass: "border-partial/20",
            progressClass: "from-partial/60 to-partial",
            blurClass: "bg-partial/10",
        };
    return {
        label: "Low",
        color: "clear",
        bgGradient: "from-clear/20 to-clear/5",
        textClass: "text-clear",
        borderClass: "border-clear/20",
        bgClass: "bg-clear/15",
        dotClass: "bg-clear",
        badgeBgClass: "bg-clear/10",
        badgeBorderClass: "border-clear/20",
        progressClass: "from-clear/60 to-clear",
        blurClass: "bg-clear/10",
    };
};

export default function DayDetailPanel({
    summary,
    onClose,
}: DayDetailPanelProps) {
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            // Restore body scroll when modal closes
            document.body.style.overflow = "unset";
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    const maxRiskLevel = getRiskLevel(summary.max_risk_score);

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={onClose}
            />

            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-l border-white/50 dark:border-white/10 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
                <Header
                    maxRiskLevel={maxRiskLevel}
                    summary={summary}
                    onClose={onClose}
                />

                {/* Content */}
                <div className="p-2 space-y-2">
                    <HeroMetricCard
                        icon={AlertTriangle}
                        label="Risk Score"
                        minValue={summary.min_risk_score}
                        maxValue={summary.max_risk_score}
                        minTimestamp={summary.min_risk_timestamp}
                        maxTimestamp={summary.max_risk_timestamp}
                        gradient={maxRiskLevel.bgGradient}
                        textClass={maxRiskLevel.textClass}
                        borderClass={maxRiskLevel.borderClass}
                        bgClass={maxRiskLevel.bgClass}
                        progressClass={maxRiskLevel.progressClass}
                        blurClass={maxRiskLevel.blurClass}
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <CompactMetricCard
                            icon={Droplets}
                            label="Water Level"
                            minValue={summary.min_water_level_cm}
                            maxValue={summary.max_water_level_cm}
                            unit="cm"
                            iconColor="bg-blue-500"
                        />
                        <CompactMetricCard
                            icon={CloudRain}
                            label="Precipitation"
                            minValue={summary.min_precipitation_mm}
                            maxValue={summary.max_precipitation_mm}
                            unit="mm"
                            iconColor="bg-primary"
                        />
                    </div>

                    <BlockageCard
                        leastSevere={summary.least_severe_blockage}
                        mostSevere={summary.most_severe_blockage}
                    />

                    <WeatherCard
                        weatherCode={summary.most_severe_weather_code}
                    />
                </div>
            </div>
        </>
    );
}
