import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import {
    type Map as MapLibreMap,
    type Marker,
    type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, MapPin, Search } from "lucide-react";

const CARTO_BASEMAP_API_KEY = (
    import.meta.env.VITE_CARTO_BASEMAP_API_KEY as string | undefined
)?.trim();

function cartoRasterTileUrl(subdomain: "a" | "b" | "c" | "d") {
    const keyQuery = CARTO_BASEMAP_API_KEY
        ? `?key=${encodeURIComponent(CARTO_BASEMAP_API_KEY)}`
        : "";

    return `https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${keyQuery}`;
}

// OpenStreetMap raster basemap served by CARTO. The API key is optional so the
// picker can still render during local development before an environment is set.
const rasterStyle: StyleSpecification = {
    version: 8,
    sources: {
        basemap: {
            type: "raster",
            tiles: [
                cartoRasterTileUrl("a"),
                cartoRasterTileUrl("b"),
                cartoRasterTileUrl("c"),
                cartoRasterTileUrl("d"),
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors, © CARTO",
        },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
};

// Default view: Valenzuela City, PH (only used before the admin places a pin).
const DEFAULT_CENTER: [number, number] = [120.9836, 14.6969];

const NOMINATIM = "https://nominatim.openstreetmap.org";

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

export interface PickedLocation {
    latitude: number;
    longitude: number;
    address?: string;
}

interface LocationPickerProps {
    searchInputId?: string;
    latitude: number | null;
    longitude: number | null;
    onChange: (next: PickedLocation) => void;
    disabled?: boolean;
    validationError?: string;
}

async function reverseGeocode(
    lat: number,
    lon: number,
    signal: AbortSignal,
): Promise<string | undefined> {
    try {
        const res = await fetch(
            `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=0`,
            { signal },
        );
        if (!res.ok) return undefined;
        const data = (await res.json()) as { display_name?: string };
        return data.display_name;
    } catch {
        return undefined;
    }
}

export default function LocationPicker({
    searchInputId,
    latitude,
    longitude,
    onChange,
    disabled = false,
    validationError,
}: LocationPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const reverseAbortRef = useRef<AbortController | null>(null);
    const reverseRequestRef = useRef(0);
    const searchAbortRef = useRef<AbortController | null>(null);
    const searchRequestRef = useRef(0);
    const disabledRef = useRef(disabled);
    // Latest onChange without forcing the map-init effect to re-run.
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);
    useEffect(() => {
        disabledRef.current = disabled;
    }, [disabled]);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
    const searchFeedbackId = searchInputId
        ? `${searchInputId}-feedback`
        : undefined;
    const validationErrorId = searchInputId
        ? `${searchInputId}-validation-error`
        : undefined;
    const searchDescriptionIds = [
        searchFeedback ? searchFeedbackId : undefined,
        validationError ? validationErrorId : undefined,
    ]
        .filter(Boolean)
        .join(" ");

    const placeMarker = (lng: number, lat: number) => {
        const map = mapRef.current;
        if (!map) return;
        if (!markerRef.current) {
            markerRef.current = new maplibregl.Marker({
                draggable: true,
                color: "#0A3D62",
            })
                .setLngLat([lng, lat])
                .addTo(map);
            markerRef.current.on("dragend", () => {
                if (disabledRef.current) return;
                const pos = markerRef.current!.getLngLat();
                void emitChange(pos.lng, pos.lat);
            });
        } else {
            markerRef.current.setLngLat([lng, lat]);
        }
    };

    const emitChange = async (lng: number, lat: number) => {
        if (disabledRef.current) return;

        reverseAbortRef.current?.abort();
        const controller = new AbortController();
        reverseAbortRef.current = controller;
        const requestId = ++reverseRequestRef.current;

        onChangeRef.current({ latitude: lat, longitude: lng });
        const address = await reverseGeocode(lat, lng, controller.signal);
        if (
            address &&
            !controller.signal.aborted &&
            requestId === reverseRequestRef.current
        ) {
            onChangeRef.current({ latitude: lat, longitude: lng, address });
        }
    };

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const hasInitial = latitude != null && longitude != null;
        const map = new maplibregl.Map({
            container: containerRef.current,
            style: rasterStyle,
            center: hasInitial ? [longitude!, latitude!] : DEFAULT_CENTER,
            zoom: hasInitial ? 16 : 12,
            attributionControl: false,
        });
        map.addControl(new maplibregl.AttributionControl({ compact: true }));
        map.addControl(
            new maplibregl.NavigationControl({ showCompass: false }),
            "top-right",
        );
        mapRef.current = map;

        if (hasInitial) {
            placeMarker(longitude!, latitude!);
        }

        // Tap-to-place: drop/move the pin wherever the admin clicks.
        map.on("click", (event) => {
            if (disabledRef.current) return;
            placeMarker(event.lngLat.lng, event.lngLat.lat);
            void emitChange(event.lngLat.lng, event.lngLat.lat);
        });

        const resize = () => map.resize();
        const observer = new ResizeObserver(resize);
        observer.observe(containerRef.current);
        requestAnimationFrame(resize);

        return () => {
            reverseRequestRef.current += 1;
            reverseAbortRef.current?.abort();
            searchRequestRef.current += 1;
            searchAbortRef.current?.abort();
            observer.disconnect();
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // Init once; subsequent value changes are reflected via the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reflect externally-changed coordinates (e.g. editing a different center)
    // onto the map without re-initializing it.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || latitude == null || longitude == null) return;
        placeMarker(longitude, latitude);
        map.easeTo({ center: [longitude, latitude], zoom: 16, duration: 400 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latitude, longitude]);

    const runSearch = async () => {
        if (disabled) return;

        const term = query.trim();
        if (!term) {
            setResults([]);
            setSearchFeedback("Enter an address or place to search.");
            return;
        }

        searchAbortRef.current?.abort();
        const controller = new AbortController();
        searchAbortRef.current = controller;
        const requestId = ++searchRequestRef.current;
        setIsSearching(true);
        setResults([]);
        setSearchFeedback(null);
        try {
            const res = await fetch(
                `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(term)}&limit=5&countrycodes=ph`,
                { signal: controller.signal },
            );
            if (!res.ok) throw new Error("Location search failed");

            const data = (await res.json()) as SearchResult[];
            if (requestId !== searchRequestRef.current) return;
            setResults(data);
            if (data.length === 0) {
                setSearchFeedback(`No places found for “${term}”.`);
            } else if (data.length === 1) {
                selectResult(data[0]);
            }
        } catch {
            if (controller.signal.aborted) return;
            if (requestId !== searchRequestRef.current) return;
            setResults([]);
            setSearchFeedback("Location search is unavailable. Please try again.");
        } finally {
            if (requestId === searchRequestRef.current) {
                setIsSearching(false);
            }
        }
    };

    const selectResult = (result: SearchResult) => {
        const lat = Number(result.lat);
        const lng = Number(result.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            setSearchFeedback("That search result has invalid coordinates.");
            return;
        }

        reverseRequestRef.current += 1;
        reverseAbortRef.current?.abort();
        const map = mapRef.current;
        if (map) {
            map.easeTo({ center: [lng, lat], zoom: 16, duration: 400 });
        }
        placeMarker(lng, lat);
        onChangeRef.current({
            latitude: lat,
            longitude: lng,
            address: result.display_name,
        });
        setResults([]);
        setSearchFeedback(null);
        setQuery(result.display_name);
    };

    const inputClass =
        "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/30";

    return (
        <div className="space-y-2">
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            id={searchInputId}
                            className={`${inputClass} pl-8`}
                            value={query}
                            disabled={disabled}
                            aria-invalid={Boolean(validationError)}
                            aria-describedby={searchDescriptionIds || undefined}
                            onChange={(e) => {
                                searchRequestRef.current += 1;
                                searchAbortRef.current?.abort();
                                setIsSearching(false);
                                setQuery(e.target.value);
                                setResults([]);
                                setSearchFeedback(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    void runSearch();
                                }
                            }}
                            placeholder="Search an address or place…"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => void runSearch()}
                        disabled={disabled || isSearching}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        Search
                    </button>
                </div>

                {results.length > 0 && (
                    <ul
                        role="listbox"
                        aria-label="Location search results"
                        className="custom-scrollbar absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
                    >
                        {results.map((result) => (
                            <li key={`${result.lat}-${result.lon}`}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected="false"
                                    onClick={() => selectResult(result)}
                                    disabled={disabled}
                                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-accent" />
                                    <span className="line-clamp-2">
                                        {result.display_name}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {searchFeedback && (
                    <p
                        id={searchFeedbackId}
                        role="status"
                        className="mt-1.5 text-xs text-slate-500 dark:text-slate-400"
                    >
                        {searchFeedback}
                    </p>
                )}
            </div>

            <div
                ref={containerRef}
                className="h-56 w-full overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700"
            />

            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {latitude != null && longitude != null ? (
                    <span>
                        Pin set at {latitude.toFixed(5)}, {longitude.toFixed(5)} —
                        drag to fine-tune.
                    </span>
                ) : (
                    <span>Search or tap the map to drop a pin.</span>
                )}
            </p>

            {validationError && (
                <p
                    id={validationErrorId}
                    role="alert"
                    className="text-xs font-medium text-red-600 dark:text-red-400"
                >
                    {validationError}
                </p>
            )}
        </div>
    );
}
