import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import type { TooltipItem } from "chart.js";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { useReadingLogs } from "../../context/ReadingLogsContext";
import Container from "../../../../components/ui/Container";
import { formatDate } from "../../../../lib/utils/formatter";
import { useTheme } from "../../../../context/ThemeContext";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
);

export default function WaterLevelChart() {
    const { summaries } = useReadingLogs();

    const chartData = useMemo(() => {
        const sorted = [...summaries].sort((a, b) =>
            a.summary_date.localeCompare(b.summary_date),
        );
        return {
            labels: sorted.map((s) => formatDate(s.summary_date)),
            minLevels: sorted.map((s) => s.min_water_level_cm),
            maxLevels: sorted.map((s) => s.max_water_level_cm),
        };
    }, [summaries]);

    const { isDark } = useTheme();

    const textColor = isDark ? "#cbd5e1" : "#4b5563";
    const titleColor = isDark ? "#e2e8f0" : "#1f2937";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

    const options = useMemo(() => {
        const allLevels = [...chartData.minLevels, ...chartData.maxLevels].filter(
            (level): level is number => level !== null,
        );
        const minLevel = allLevels.length > 0 ? Math.min(...allLevels) : 0;
        const maxLevel = allLevels.length > 0 ? Math.max(...allLevels) : 100;
        const range = Math.max(maxLevel - minLevel, 10);
        const yMin = Math.max(0, Math.floor(minLevel - range * 0.1));
        const yMax = Math.ceil(maxLevel + range * 0.1);

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top" as const,
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 },
                    },
                },
                tooltip: {
                    mode: "index" as const,
                    intersect: false,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    callbacks: {
                        label: function (context: TooltipItem<"line">) {
                            return `${context.dataset.label}: ${context.parsed.y} cm`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    min: yMin,
                    max: yMax,
                    grid: {
                        color: gridColor,
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 11 },
                        callback: (value: string | number) => `${value} cm`,
                    },
                    title: {
                        display: true,
                        text: "Water Level (cm)",
                        color: titleColor,
                        font: { size: 11, weight: "bold" as const },
                    },
                },
                x: {
                    grid: {
                        color: gridColor,
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 10 },
                        maxTicksLimit: 8,
                        maxRotation: 45,
                    },
                },
            },
            interaction: {
                mode: "nearest" as const,
                axis: "x" as const,
                intersect: false,
            },
            elements: {
                line: { tension: 0.4 },
                point: { radius: 3, hoverRadius: 5 },
            },
        };
    }, [chartData, textColor, titleColor, gridColor]);

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: "Max Level",
                data: chartData.maxLevels,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                borderWidth: 2,
                fill: "+1",
                tension: 0.4,
                pointBackgroundColor: "rgb(59, 130, 246)",
                pointBorderColor: "white",
                pointBorderWidth: 1,
            },
            {
                label: "Min Level",
                data: chartData.minLevels,
                borderColor: "rgb(147, 197, 253)",
                backgroundColor: "rgba(147, 197, 253, 0.1)",
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: "rgb(147, 197, 253)",
                pointBorderColor: "white",
                pointBorderWidth: 1,
            },
        ],
    };

    return (
        <Container headerTitle="WATER LEVEL RANGE" className="h-80">
            <div className="h-60">
                <Line data={data} options={options} />
            </div>
        </Container>
    );
}
