export interface DailySummary {
    summary_date: string;
    min_risk_score: number | null;
    max_risk_score: number | null;
    min_risk_timestamp: string | null;
    max_risk_timestamp: string | null;
    least_severe_blockage: string | null;
    most_severe_blockage: string | null;
    min_water_level_cm: number | null;
    max_water_level_cm: number | null;
    min_water_timestamp: string | null;
    max_water_timestamp: string | null;
    min_precipitation_mm: number | null;
    max_precipitation_mm: number | null;
    min_precip_timestamp: string | null;
    max_precip_timestamp: string | null;
    most_severe_weather_code: number | null;
}
