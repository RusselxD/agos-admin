import { AlertTriangle, Bell, Gauge } from "lucide-react";
import type { ReactNode } from "react";
import { useCalibrationCard } from "./CalibrationCardContext";

import Container from "../../../../components/ui/Container";

interface ThresholdCardProps {
    title: string;
    desc: string;
    icon: ReactNode;
    className?: string;
    children?: ReactNode;
}

const ThresholdCard = ({
    title,
    desc,
    icon,
    className,
    children,
}: ThresholdCardProps) => {
    return (
        <div
            className={`rounded-md p-3 flex items-center gap-5 border ${className}`}
        >
            {icon}
            <div className="space-y-1 flex-1">
                <h2 className="font-semibold dark:text-slate-100">{title}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">{desc}</p>
                {children}
            </div>
        </div>
    );
};

const HeightInput = ({
    height,
    config,
    error,
}: {
    height: number | undefined;
    config: "installation_height" | "warning_threshold" | "critical_threshold";
    error?: string;
}) => {
    const { handleUpdateConfig } = useCalibrationCard();
    const errorId = `${config}-error`;

    return (
        <div className="w-full">
            <div className="flex items-center w-full gap-2">
                <input
                    type="number"
                    step="1"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    className={`px-3 py-2 w-full rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 ${
                        error
                            ? "border-red-500 dark:border-red-500 focus:ring-red-500/50"
                            : "border-gray-300 dark:border-slate-700 focus:ring-primary/50"
                    }`}
                    value={Number.isFinite(height) ? height : ""}
                    onChange={(e) =>
                        handleUpdateConfig(config, e.target.valueAsNumber)
                    }
                />
                <span>cm</span>
            </div>
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
                >
                    {error}
                </p>
            )}
        </div>
    );
};

const HeightDisplay = ({ height }: { height: number | undefined }) => {
    return (
        <p className="px-3 py-2 w-3/4 rounded-md bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-slate-900 dark:text-slate-200">{`${height} cm`}</p>
    );
};

const InstallationHeightCard = () => {
    // 1. User clicks "Auto" button
    // 2. Frontend sends request to Raspberry Pi API
    // 3. Pi triggers ultrasonic sensor to take reading
    // 4. Sensor returns distance (e.g., 150cm to canal bottom)
    // 5. Pi sends this value back to frontend
    // 6. Frontend auto-fills the Installation Height field

    const { isEditing, originalConfig, newConfig, validationErrors } =
        useCalibrationCard();

    return (
        <ThresholdCard
            className="bg-gray-50 dark:bg-slate-900/50 border-gray-300 dark:border-slate-700/50"
            title="Installation Height"
            desc="Distance from sensor to the bottom"
            icon={
                <Gauge className="shrink-0 p-4 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-14 h-14" />
            }
        >
            <div>
                {isEditing ? (
                    <HeightInput
                        height={newConfig?.installation_height}
                        config="installation_height"
                        error={validationErrors.installation_height}
                    />
                ) : (
                    <HeightDisplay
                        height={originalConfig?.installation_height}
                    />
                )}
            </div>
        </ThresholdCard>
    );
};

const WarningThresholdCard = () => {
    const { isEditing, originalConfig, newConfig, validationErrors } =
        useCalibrationCard();

    return (
        <ThresholdCard
            className="bg-yellow-50 dark:bg-amber-900/20 border-yellow-300 dark:border-amber-700/50"
            title="Warning Threshold"
            desc="Early warning water level depth"
            icon={
                <Bell className="shrink-0 p-4 rounded-md bg-yellow-100 dark:bg-amber-900/30 text-yellow-600 dark:text-amber-400 w-14 h-14" />
            }
        >
            <div>
                {isEditing ? (
                    <HeightInput
                        height={newConfig?.warning_threshold}
                        config="warning_threshold"
                        error={validationErrors.warning_threshold}
                    />
                ) : (
                    <HeightDisplay height={originalConfig?.warning_threshold} />
                )}
            </div>
        </ThresholdCard>
    );
};

const CriticalThresholdCard = () => {
    const { isEditing, originalConfig, newConfig, validationErrors } =
        useCalibrationCard();

    return (
        <ThresholdCard
            className="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700/50"
            title="Critical Threshold"
            desc="Maximum safe water level depth"
            icon={
                <AlertTriangle className="shrink-0 p-4 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 w-14 h-14" />
            }
        >
            <div>
                {isEditing ? (
                    <HeightInput
                        height={newConfig?.critical_threshold}
                        config="critical_threshold"
                        error={validationErrors.critical_threshold}
                    />
                ) : (
                    <HeightDisplay
                        height={originalConfig?.critical_threshold}
                    />
                )}
            </div>
        </ThresholdCard>
    );
};

export default function SensorConfiguration() {
    const { isFetching, isSaving, isEditing, setIsEditing, handleSaveChanges } =
        useCalibrationCard();

    if (isFetching) {
        return (
            <Container headerTitle="SENSOR CONFIGURATION">
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="skeleton rounded-md w-full h-28"></div>
                    <div className="skeleton rounded-md w-full h-28"></div>
                    <div className="skeleton rounded-md w-full h-28"></div>
                </div>
                <div className="flex justify-end">
                    <div className="skeleton rounded-md w-40 h-12 mt-3"></div>
                </div>
            </Container>
        );
    }

    return (
        <Container headerTitle="SENSOR CONFIGURATION">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InstallationHeightCard />
                <WarningThresholdCard />
                <CriticalThresholdCard />
                <div className="flex flex-col md:flex-row gap-2 font-medium md:col-span-3 md:justify-end">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveChanges()}
                                disabled={isSaving}
                                className="btn-custom bg-primary text-white hover:bg-primary/90 disabled:hover:bg-primary"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn-custom bg-primary text-white hover:bg-primary/90"
                        >
                            Edit Configuration
                        </button>
                    )}
                </div>
            </div>
        </Container>
    );
}
