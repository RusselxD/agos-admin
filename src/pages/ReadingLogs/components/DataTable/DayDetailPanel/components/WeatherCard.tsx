import { createElement } from "react";
import {
    getWeatherDescription,
    getWeatherIcon,
} from "../../../../../../lib/utils/weather";

export default function WeatherCard({ weatherCode }: { weatherCode: number | null }) {
    const WeatherIcon = getWeatherIcon(weatherCode ?? -1);
    const description = weatherCode === null ? "N/A" : getWeatherDescription(weatherCode);

    return (
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-sky-100 dark:border-slate-700/50 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-sky-600 dark:text-sky-400 uppercase tracking-wide mb-1">
                        Most Severe Weather Condition
                    </p>
                    <p className="text-lg font-semibold text-neutral dark:text-slate-200">
                        {description}
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-sky-500/10 shadow-sm">
                    {createElement(WeatherIcon, { className: "w-8 h-8 text-sky-500 dark:text-sky-400" })}
                </div>
            </div>
        </div>
    );
}
