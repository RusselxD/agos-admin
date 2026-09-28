import type { SensorConfig } from "../../../../types/sensor";

export type SensorConfigValidationErrors = Partial<
    Record<keyof SensorConfig, string>
>;

export const validateSensorConfig = (
    config: SensorConfig | null,
): SensorConfigValidationErrors => {
    if (!config) {
        return {};
    }

    const errors: SensorConfigValidationErrors = {};
    const fields: (keyof SensorConfig)[] = [
        "installation_height",
        "warning_threshold",
        "critical_threshold",
    ];

    fields.forEach((field) => {
        if (!Number.isFinite(config[field])) {
            errors[field] = "Enter a valid number.";
        } else if (!Number.isInteger(config[field])) {
            errors[field] = "Enter a whole number.";
        }
    });

    const thresholdsAreNumeric =
        Number.isFinite(config.warning_threshold) &&
        Number.isFinite(config.critical_threshold);

    if (
        thresholdsAreNumeric &&
        config.warning_threshold >= config.critical_threshold
    ) {
        errors.warning_threshold =
            "Warning threshold must be lower than critical threshold.";
        errors.critical_threshold =
            "Critical threshold must be higher than warning threshold.";
    }

    return errors;
};
