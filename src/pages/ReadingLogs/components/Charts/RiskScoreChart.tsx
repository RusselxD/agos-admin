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

export default function RiskScoreChart() {
    const { summaries } = useReadingLogs();

    const chartData = useMemo(() => {
        // Keep dates chronological, regardless of response order.
        const sorted = [...summaries].sort((a, b) =>
            a.summary_date.localeCompare(b.summary_date),
        );
        return {
            labels: sorted.map((s) => formatDate(s.summary_date)),
            minScores: sorted.map((s) => s.min_risk_score),
            maxScores: sorted.map((s) => s.max_risk_score),
        };
    }, [summaries]);

    const { isDark } = useTheme();

    const textColor = isDark ? "#cbd5e1" : "#4b5563";
    const titleColor = isDark ? "#e2e8f0" : "#1f2937";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

    const options = useMemo(
        () => ({
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
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    min: 0,
                    max: 110,
                    grid: {
                        color: gridColor,
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 11 },
                        callback: (value: string | number) => `${value}`,
                    },
                    title: {
                        display: true,
                        text: "Risk Score",
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
                line: { tension: 0.3 },
                point: { radius: 3, hoverRadius: 5 },
            },
        }),
        [textColor, titleColor, gridColor],
    );

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: "Max Risk",
                data: chartData.maxScores,
                borderColor: "#E74C3C",
                backgroundColor: "rgba(231, 76, 60, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: "#E74C3C",
                pointBorderColor: "white",
                pointBorderWidth: 1,
            },
            {
                label: "Min Risk",
                data: chartData.minScores,
                borderColor: "#2ECC71",
                backgroundColor: "rgba(46, 204, 113, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: "#2ECC71",
                pointBorderColor: "white",
                pointBorderWidth: 1,
            },
        ],
    };

    return (
        <Container headerTitle="RISK SCORE TREND" className="h-80">
            <div className="h-60">
                <Line data={data} options={options} />
            </div>
        </Container>
    );
}
