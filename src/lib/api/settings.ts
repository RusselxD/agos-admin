import type { SystemSettingsUpdate } from "../../types/system_settings";
import apiClient from "./axiosConfig";

export const settingsAPI = {
    getSettingValue: async (key: string): Promise<unknown> => {
        const res = await apiClient.get(`/system-settings/${key}/value`);
        return res.data;
    },

    updateSetting: async (update: SystemSettingsUpdate): Promise<unknown> => {
        const res = await apiClient.put(
            `/system-settings/${update.key}`,
            update,
        );
        return res.data;
    },

    updateDataRetention: async (
        update: SystemSettingsUpdate,
    ): Promise<number> => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const res = await apiClient.put<number>(
            `/system-settings/${update.key}`,
            update,
        );
        return res.data as number;
    },
};
