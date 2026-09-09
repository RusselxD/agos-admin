import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import type {
    AlertThresholds,
    FusionAnalysisData,
    FusionAnalysisSummaryResponse,
} from "../types/fusionAnalysis";

import { settingsAPI } from "../lib/api/settings";
import { useWebSocketMessage } from "./WebSocketContext";

interface FusionAnalysisContextValue {
    fusionAnalysis: FusionAnalysisData | null;
    alertThresholds: AlertThresholds | null;
    isFetching: boolean;
    warning: string | null;
    error: string | null;
}

const FusionAnalysisContext = createContext<
    FusionAnalysisContextValue | undefined
>(undefined);

export function FusionAnalysisProvider({ children }: { children: ReactNode }) {
    const [alertThresholds, setAlertThresholds] =
        useState<AlertThresholds | null>(null);

    const [fusionAnalysis, setFusionAnalysis] =
        useState<FusionAnalysisData | null>(null);
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [warning, setWarning] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAlertThresholds = async () => {
            try {
                const res = (await settingsAPI.getSettingValue(
                    "alert_thresholds",
                )) as AlertThresholds;
                setAlertThresholds(res);
            } catch {
                setError("Failed to fetch alert thresholds");
            }
        };

        fetchAlertThresholds();
    }, []);

    useWebSocketMessage(
        "fusion_analysis_update",
        (data: FusionAnalysisSummaryResponse) => {
            setIsFetching(false);

            if (data.status == "error") {
                setError(data.message);
                return;
            }

            if (data.status == "warning") {
                setWarning(data.message);
                setError(null);
                setFusionAnalysis(data.fusion_analysis);
                return;
            }

            setError(null);
            setWarning(null);
            setFusionAnalysis(data.fusion_analysis);

        }
    );

    const contextValue = useMemo(
        () => ({ fusionAnalysis, alertThresholds, isFetching, warning, error }),
        [fusionAnalysis, alertThresholds, isFetching, warning, error]
    );

    return (
        <FusionAnalysisContext.Provider value={contextValue}>
            {children}
        </FusionAnalysisContext.Provider>
    );
}

export const useFusionAnalysis = () => {
    const context = useContext(FusionAnalysisContext);
    if (context === undefined) {
        throw new Error(
            "useFusionAnalysis must be used within a FusionAnalysisProvider"
        );
    }
    return context;
};
