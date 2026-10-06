import { useReadingLogs } from "../../context/ReadingLogsContext";
import DateDropdown from "./DateDropdown";

export default function DateRangePicker() {
    const { startDate, endDate, setStartDate, setEndDate, availableDays } =
        useReadingLogs();

    if (availableDays.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <DateDropdown
                value={startDate}
                options={availableDays}
                onChange={(date) => {
                    setStartDate(date);
                    if (date > endDate) setEndDate(date);
                }}
            />

            <span className="text-gray-400 text-sm">to</span>

            <DateDropdown
                value={endDate}
                options={availableDays}
                onChange={(date) => {
                    setEndDate(date);
                    if (date < startDate) setStartDate(date);
                }}
            />
        </div>
    );
}
