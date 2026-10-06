import { Doughnut } from "react-chartjs-2";
import { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from "chart.js";
import type { TooltipItem } from "chart.js";
import { useReadingLogs } from "../../context/ReadingLogsContext";
import Container from "../../../../components/ui/Container";

ChartJS.register(ArcElement, Title, Tooltip, Legend);

export default function BlockageSeverityChart() {
    const { summaries } = useReadingLogs();

    const chartData = useMemo(() => {
        const distribution = {
            clear: 0,
            partial: 0,
            blocked: 0,
        };

        summaries.forEach((s) => {
            const severity = s.most_severe_blockage?.toLowerCase();
            if (severity === "clear") distribution.clear++;
            else if (severity === "partial") distribution.partial++;
            else if (severity === "blocked") distribution.blocked++;
        });

        return distribution;
    }, [summaries]);

    const totalDays = chartData.clear + chartData.partial + chartData.blocked;
    const missingDays = summaries.length - totalDays;

    const options = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    callbacks: {
                        label: function (context: TooltipItem<"doughnut">) {
                            const value = context.raw as number;
                            const percentage = (
                                (value / Math.max(totalDays, 1)) *
                                100
                            ).toFixed(1);
                            return `${context.label}: ${value} days (${percentage}%)`;
                        },
                    },
                },
            },
            cutout: "65%",
        }),
        [totalDays],
    );

    const data = {
        labels: ["Clear", "Possible", "Potential Surface Obstruction"],
        datasets: [
            {
                data: [chartData.clear, chartData.partial, chartData.blocked],
                backgroundColor: [
                    "rgba(46, 204, 113, 0.8)",
                    "rgba(243, 156, 18, 0.8)",
                    "rgba(231, 76, 60, 0.8)",
                ],
                borderColor: ["#2ECC71", "#F39C12", "#E74C3C"],
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    };

    const total = chartData.clear + chartData.partial + chartData.blocked;

    return (
        <Container headerTitle="SURFACE OBSTRUCTION DISTRIBUTION" className="h-80">
            <div className="flex flex-1 items-center justify-center gap-10">
                <div className="h-44 flex items-center justify-center mt-5">
                    <div className="relative w-44 h-44">
                        <Doughnut data={data} options={options} />
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-2xl font-bold text-neutral dark:text-slate-200 transition-colors">
                                {total}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 transition-colors">Observed Days</p>
                        </div>
                    </div>
                </div>
                {/* Custom legend */}
                <div className="flex flex-col justify-center gap-6 text-sm font-semibold">
                    {missingDays > 0 && (
                        <span className="text-gray-500 dark:text-slate-400">N/A ({missingDays} days)</span>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-clear"></span>
                        <span className="text-gray-600 dark:text-slate-300 transition-colors">
                            Clear ({chartData.clear})
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-partial"></span>
                        <span className="text-gray-600 dark:text-slate-300 transition-colors">
                            Possible ({chartData.partial})
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blocked"></span>
                        <span className="text-gray-600 dark:text-slate-300 transition-colors">
                            Potential ({chartData.blocked})
                        </span>
                    </div>
                </div>
            </div>
        </Container>
    );
}
