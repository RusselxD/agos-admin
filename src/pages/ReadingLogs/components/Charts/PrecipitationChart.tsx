import { Bar } from "react-chartjs-2";
import { useMemo } from "react";
import type { TooltipItem } from "chart.js";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { useReadingLogs } from "../../context/ReadingLogsContext";
import Container from "../../../../components/ui/Container";
import { formatDate } from "../../../../lib/utils/formatter";
import { useTheme } from "../../../../context/ThemeContext";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
);

export default function PrecipitationChart() {
    const { summaries } = useReadingLogs();

    const chartData = useMemo(() => {
        const sorted = [...summaries].sort((a, b) =>
            a.summary_date.localeCompare(b.summary_date),
        );
        return {
            labels: sorted.map((s) => formatDate(s.summary_date)),
            minPrecip: sorted.map((s) => s.min_precipitation_mm),
            maxPrecip: sorted.map((s) => s.max_precipitation_mm),
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
                        label: function (context: TooltipItem<"bar">) {
                            return `${context.dataset.label}: ${context.parsed.y} mm`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 11 },
                        callback: (value: string | number) => `${value} mm`,
                    },
                    title: {
                        display: true,
                        text: "Precipitation (mm)",
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
        }),
        [textColor, titleColor, gridColor],
    );

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: "Max Precipitation",
                data: chartData.maxPrecip,
                backgroundColor: "rgba(10, 61, 98, 0.8)",
                borderColor: "#0A3D62",
                borderWidth: 1,
                borderRadius: 4,
            },
            {
                label: "Min Precipitation",
                data: chartData.minPrecip,
                backgroundColor: "rgba(26, 188, 156, 0.6)",
                borderColor: "#1ABC9C",
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    return (
        <Container headerTitle="PRECIPITATION LEVELS" className="h-80">
            <div className="h-60">
                <Bar data={data} options={options} />
            </div>
        </Container>
    );
}
