import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SensorConfig } from "../../../../types/sensor";
import { sensorAPI } from "../../../../lib/api/sensor";
import { useCoreHook } from "../../../../context/CoreContext";
import { useToast } from "../../../../context/ToastContext";
import {
    validateSensorConfig,
    type SensorConfigValidationErrors,
} from "./sensorConfigValidation";

interface CalibrationCardContextValue {
    originalConfig: SensorConfig | null;
    newConfig: SensorConfig | null;
    validationErrors: SensorConfigValidationErrors;
    handleUpdateConfig: (config: keyof SensorConfig, value: number) => void;

    isFetching: boolean;

    isEditing: boolean;
    setIsEditing: (value: boolean) => void;

    isSaving: boolean;
    handleSaveChanges: () => void;
}

const CalibrationCardContext = createContext<
    CalibrationCardContextValue | undefined
>(undefined);

export function SensorConfigurationProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [originalConfig, setOriginalConfig] = useState<SensorConfig | null>(
        null,
    );

    const [newConfig, setNewConfig] = useState<SensorConfig | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [showValidationErrors, setShowValidationErrors] =
        useState<boolean>(false);

    const handleUpdateConfig = (
        config: keyof SensorConfig,
        value: number,
    ) => {
        setNewConfig((prev) => (prev ? { ...prev, [config]: value } : null));
    };

    const currentValidationErrors = useMemo(
        () => validateSensorConfig(newConfig),
        [newConfig],
    );
    const validationErrors = useMemo(
        () => (showValidationErrors ? currentValidationErrors : {}),
        [currentValidationErrors, showValidationErrors],
    );

    const { sensorDeviceDetails } = useCoreHook();
    const { toastSuccess, toastError } = useToast();

    useEffect(() => {
        const fetchSensorConfig = async () => {
            try {
                setIsFetching(true);
                const res = await sensorAPI.getSensorConfig(
                    sensorDeviceDetails.sensor_device_id,
                );
                setOriginalConfig(res);
            } catch (error) {
            } finally {
                setIsFetching(false);
            }
        };
        fetchSensorConfig();
    }, []);

    // When entering edit mode, initialize newConfig with originalConfig
    useEffect(() => {
        if (isEditing) {
            setNewConfig(originalConfig);
            setShowValidationErrors(false);
        }
    }, [isEditing]);

    const handleSaveChanges = async () => {
        if (!newConfig) return;

        if (Object.keys(currentValidationErrors).length > 0) {
            setShowValidationErrors(true);
            toastError("Please correct the sensor configuration errors");
            return;
        }

        try {
            setIsSaving(true);
            const updated = await sensorAPI.updateSensorConfig(
                sensorDeviceDetails.sensor_device_id,
                newConfig,
            );
            setOriginalConfig(updated);
            setIsEditing(false);
            toastSuccess("Sensor configuration updated");
        } catch {
            toastError("Failed to update sensor configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const contextValue = useMemo(
        () => ({
            originalConfig,
            newConfig,
            validationErrors,
            handleUpdateConfig,
            isFetching,
            isSaving,
            isEditing,
            setIsEditing,
            handleSaveChanges,
        }),
        [
            originalConfig,
            newConfig,
            validationErrors,
            isEditing,
            isFetching,
            isSaving,
        ],
    );

    return (
        <CalibrationCardContext.Provider value={contextValue}>
            {children}
        </CalibrationCardContext.Provider>
    );
}

export const useCalibrationCard = () => {
    const context = useContext(CalibrationCardContext);
    if (!context) {
        throw new Error(
            "useCalibrationCard must be used within a CalibrationCardProvider",
        );
    }
    return context;
};
