import {
    Line,
    Stop,
    Pattern,
    Calendar,
} from "./services/opt-web/opt-web.types";
import { normalizeRouteName, toHexColor } from "./utils";

export function optStopsToGtfsStops(stops: Stop[]): string {
    const header = "stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon";
    const lines = stops.map((stop) => {
        const stopId = stop.id;
        const stopCode = stop.code;
        const stopName = stop.name;
        const stopDesc = stop.description || "";
        const stopLat = stop.coordX;
        const stopLon = stop.coordY;

        return `${stopId},${stopCode},${stopName},${stopDesc},${stopLat},${stopLon}`;
    });

    return [header, ...lines].join("\n");
}

export function optLinesToGtfsRoutes(
    lines: Line[],
    agencyId: string,
    routeType: string,
    defaultRouteColor: string = "",
    defaultRouteTextColor: string = ""
): string {
    const header =
        "route_id,agency_id,route_short_name,route_long_name,route_color,route_type,route_color,route_text_color,original_route_long_name";
    const routeLines = lines.map((line) => {
        const routeId = line.id;
        const routeShortName = line.code;
        const routeLongName = line.name;
        const routeColor = line.lineColorFormatted
            ? toHexColor(line.lineColorFormatted)
            : "";
        const normalizedRouteLongName = normalizeRouteName(routeLongName);

        return `${routeId},${agencyId},${routeShortName},${normalizedRouteLongName},${routeColor},${routeType},${defaultRouteColor},${defaultRouteTextColor},${routeLongName}`;
    });

    return [header, ...routeLines].join("\n");
}

export function optPatternToGtfsTrips(
    tripPrefix: string,
    line: Line,
    direction: "G" | "R",
    calendar: Calendar,
    pattern: Pattern,
    includeHeader = true
): string {
    const header = "route_id,service_id,trip_id,direction_id";
    const tripLines = pattern.trips.map((tripSteps) => {
        const directionId = direction === "G" ? 0 : 1;
        const routeId = line.id;
        const exceptionsDescriptions = tripSteps[0].exceptions
            .map(
                (d) => pattern.exceptions.find((ex) => ex.id === d)?.description
            )
            .filter((desc) => desc)
            .join(";");
        const serviceId = exceptionsDescriptions
            ? `${calendar.name} (${exceptionsDescriptions})`
            : calendar.name;
        const tripId = `${tripPrefix}_${line.code}_${directionId}_${
            tripSteps.length
        }_${tripSteps[0].time}_${tripSteps[tripSteps.length - 1].time}`;

        return `${routeId},${optServiceNameToGtfsCalendarId(
            serviceId
        )},${tripId},${directionId}`;
    });

    if (!includeHeader) {
        return tripLines.join("\n");
    }

    return [header, ...tripLines].join("\n");
}

export function optPatternToGtfsTripsAndCalendarDates(
    tripPrefix: string,
    line: Line,
    direction: "G" | "R",
    calendar: Calendar,
    pattern: Pattern,
    includeHeader = true,
    processedTripIds: string[],
    processedServiceIds: string[]
): [string, string, string[], string[]] {
    const calendarDatesLines: string[] = [];
    const calendarDatesHeader = "service_id,date,exception_type";
    const currentProcessedServiceIds = new Set<string>();
    const currentProcessedTripIds = new Set<string>();

    const tripsHeader = "route_id,service_id,trip_id,direction_id";
    const tripLines = pattern.trips
        .map((tripSteps) => {
            const directionId = direction === "G" ? 0 : 1;
            const routeId = line.id;
            const exceptionsDescriptions = tripSteps[0].exceptions
                .map(
                    (d) =>
                        pattern.exceptions.find((ex) => ex.id === d)
                            ?.description
                )
                .filter((desc) => desc)
                .join(";");
            const optServiceName = exceptionsDescriptions
                ? `${calendar.name} (${exceptionsDescriptions})`
                : calendar.name;
            const serviceId = optServiceNameToGtfsCalendarId(optServiceName);
            const tripId = `${tripPrefix}_${serviceId}_${
                line.code
            }_${directionId}_${tripSteps.length}_${tripSteps[0].time}_${
                tripSteps[tripSteps.length - 1].time
            }`;

            // avoid processing the same service more than once
            if (
                !processedServiceIds.includes(serviceId) &&
                !currentProcessedServiceIds.has(serviceId)
            ) {
                currentProcessedServiceIds.add(serviceId);
                const exceptions = getExceptionsForServiceId(serviceId, false);
                if (exceptions.length > 0) {
                    calendarDatesLines.push(...exceptions);
                }
            }

            // avoid processing the same trip more than once
            if (
                !processedTripIds.includes(tripId) &&
                !currentProcessedTripIds.has(tripId)
            ) {
                currentProcessedTripIds.add(tripId);
            } else {
                return null;
            }

            return `${routeId},${serviceId},${tripId},${directionId}`;
        })
        .filter(Boolean);

    if (!includeHeader) {
        return [
            tripLines.join("\n"),
            calendarDatesLines.join("\n"),
            Array.from(currentProcessedTripIds),
            Array.from(currentProcessedServiceIds),
        ];
    }

    return [
        [tripsHeader, ...tripLines].join("\n"),
        [calendarDatesHeader, ...calendarDatesLines].join("\n"),
        Array.from(currentProcessedTripIds),
        Array.from(currentProcessedServiceIds),
    ];
}

export function optPatternsToGtfsStopTimes(
    tripPrefix: string,
    line: Line,
    direction: "G" | "R",
    calendar: Calendar,
    pattern: Pattern,
    includeHeader = true,
    processedTripIds: string[]
): [string, string[]] {
    const header =
        "trip_id,arrival_time,departure_time,stop_id,stop_sequence,timepoint";
    const stopTimeLines: string[] = [];

    const currentProcessedTripIds = new Set<string>();

    const directionId = direction === "G" ? 0 : 1;

    pattern.trips.forEach((tripSteps) => {
        const exceptionsDescriptions = tripSteps[0].exceptions
            .map(
                (d) => pattern.exceptions.find((ex) => ex.id === d)?.description
            )
            .filter((desc) => desc)
            .join(";");
        const optServiceName = exceptionsDescriptions
            ? `${calendar.name} (${exceptionsDescriptions})`
            : calendar.name;
        const serviceId = optServiceNameToGtfsCalendarId(optServiceName);
        const tripId = `${tripPrefix}_${serviceId}_${
            line.code
        }_${directionId}_${tripSteps.length}_${tripSteps[0].time}_${
            tripSteps[tripSteps.length - 1].time
        }`;

        // skip already processed trips
        if (
            !processedTripIds.includes(tripId) &&
            !currentProcessedTripIds.has(tripId)
        ) {
            currentProcessedTripIds.add(tripId);
        } else {
            return;
        }

        tripSteps.forEach((stopTime, index) => {
            const arrivalTime = `${stopTime.time}:00`;
            const departureTime = `${stopTime.time}:00`;
            const stopId = stopTime.stopId;
            const stopSequence = index + 1;
            const timepoint =
                index == 0 || index == tripSteps.length - 1 ? 1 : 0; // consider exact times start and end of trip

            stopTimeLines.push(
                `${tripId},${arrivalTime},${departureTime},${stopId},${stopSequence},${timepoint}`
            );
        });
    });

    if (!includeHeader) {
        return [stopTimeLines.join("\n"), Array.from(currentProcessedTripIds)];
    }
    return [
        [header, ...stopTimeLines].join("\n"),
        Array.from(currentProcessedTripIds),
    ];
}

const CALENDAR_ID_MAPPINGS = {
    "Dias Úteis": "DU",
    "Dias Úteis (Escolar)": "ESC-DU",
    "Dias Úteis (Não Escolar)": "FER-DU",
    "Dias Úteis (Não Escolar (Excepto Agosto))": "FER-DU-XAGO",
    "Dias Úteis (Apenas Quarta-Feira;Escolar,exceto Feriado Municipal Portalegre)":
        "ESC-4-XFMPTG",
    "Dias Úteis (Apenas Quarta-Feira e Sexta-Feira;Escolar)": "ESC-46",
    "Dias Úteis (Exceto Quarta-Feira e Sexta-Feira;Escolar)": "ESC-DU-X46",
    "Segunda a Quarta (Escolar)": "ESC-234",
    "Segunda a Quarta (Normal (exceto Agosto))": "234-XAGO",
    "Segunda a Quarta (Agosto)": "234-AGO",
    "Quarta-Feira | Sexta-Feira (Escolar)": "ESC-46",
    "Quarta-Feira | Sexta-Feira (Normal (exceto Agosto))": "46-XAGO",
    "Quarta-Feira | Sexta-Feira (Agosto)": "46-AGO",
    "Quarta-Feira": "4",
    "Dias Úteis (Escolar,exceto Feriado Municipal Portalegre)": "ESC-DU-XFMPTG",
    "Dias Úteis (Não escolar, exceto Feriado Munic Portalegre)":
        "FER-DU-XFMPTG",
    "Dias Úteis (Escollar, exceto Feriado Municipal Elvas)": "ESC-DU-XFMELV",
    "Dias Úteis (Não escolar, exceto feriado Municipal Elvas)": "FER-DU-XFMELV",
    "Dias Úteis (Exceto Quarta-Feira;Escolar)": "ESC-DU-X4",
    "Dias Úteis (Apenas Segunda-Feira;Não Escolar)": "FER-2",
    "Dias Úteis (Exceto Segunda-Feira;Não Escolar)": "FER-DU-X2",
    "Dias Úteis (Apenas Segunda-Feira)": "2",
    "Dias Úteis (Exceto Segunda-Feira)": "DU-X2",
    "Dias Úteis (Escolar (exceto Agosto))": "ESC-DU-XAGO",
    "Dias Úteis (Normal (exceto Agosto))": "DU-XAGO",
    "Quinta-Feira (Não Escolar (Excepto Agosto))": "FER-5-XAGO",
    "Quinta-Feira (Escolar (exceto Agosto))": "ESC-5-XAGO",
    "Quinta-Feira (Não Escolar)": "FER-5",
    "Quinta-Feira (Escolar)": "ESC-5",
    "Segunda-Feira | Terça-Feira | Quarta-Feira | Sexta-Feira (Escolar (exceto Agosto))":
        "ESC-2346-XAGO",
    "Segunda-Feira | Terça-Feira | Quarta-Feira | Sexta-Feira (Não Escolar)":
        "FER-2346",
    "Segunda-Feira | Terça-Feira | Quarta-Feira | Sexta-Feira (Apenas Quarta-Feira;Escolar (exceto Agosto))":
        "ESC-4-XAGO",
    "Segunda-Feira | Terça-Feira | Quarta-Feira | Sexta-Feira (Escolar)":
        "ESC-2346",
    "Dias Úteis (Apenas Quarta-Feira;Não escolar, exceto Feriado Munic Portalegre)":
        "FER-4-XFMPTG",
    "Quinta-Feira (Excepto Agosto)": "5-XAGO",
    "Dias Úteis (Exceto Quarta-Feira e Sexta-Feira)": "DU-X46",
    "Segunda-Feira | Quarta-Feira": "24",
    "Dias Úteis (Não Escolar (Excepto Julho))": "FER-DU-XJUL",
    "Dias Úteis (Apenas Sexta-Feira;Escolar)": "ESC-6",
    "Dias Úteis (Exceto Sexta-Feira;Escolar)": "ESC-DU-X6",
    "Dias Úteis (Apenas Quarta-Feira)": "4",

    "Quinta-Feira | Sexta-Feira | Domingo (2f Pas, 3f car, 6s.,Dom, 2f se F 5 se vesp F)":
        "56DOM-2P-3C",
};

// export function optServiceNameToGtfsCalendarId(serviceName: string): string {
//     const serviceNameNormalized = serviceName.trim().toLowerCase();

//     const elements = [];

//     if (serviceNameNormalized.includes("não escolar")) {
//         elements.push("FER");
//     } else if (
//         serviceNameNormalized.includes("escolar") ||
//         serviceNameNormalized.includes("escollar")
//     ) {
//         elements.push("ESC");
//     }

//     if (serviceNameNormalized.includes("dias úteis")) elements.push("DU");

//     if (serviceNameNormalized.includes("exceto agosto")) elements.push("XAGO");
//     if (serviceNameNormalized.includes("exceto julho")) elements.push("XJUL");

//     return elements.join("-");
// }

export function optServiceNameToGtfsCalendarId(serviceName: string): string {
    const mappedId =
        CALENDAR_ID_MAPPINGS[serviceName as keyof typeof CALENDAR_ID_MAPPINGS];
    if (mappedId) {
        return mappedId;
    }

    return `"${serviceName}"`;
}

const DATE_RANGES_BY_SERVICE_ID_PARTS: Record<
    string,
    (
        | { range: [string, string]; type: number }
        | { date: string; type: number }
    )[]
> = {
    XAGO: [{ range: ["20250801", "20250831"], type: 2 }],
    ESC: [
        { range: ["20251222", "20260104"], type: 2 },
        { range: ["20260216", "20260217"], type: 2 },
        { range: ["20260330", "20260409"], type: 2 },
        { range: ["20260614", "20260910"], type: 2 },
    ],
    FER: [
        { range: ["20250911", "20251215"], type: 2 },
        { range: ["20250105", "20250216"], type: 2 },
        { range: ["20250218", "20250429"], type: 2 },
        { range: ["20260410", "20260612"], type: 2 },
    ],
    XFMPTG: [{ date: "20260523", type: 2 }],
    XFMELV: [{ date: "20260114", type: 2 }],

    // STAA specific (route 5560)
    // Se 6ª feira for Feriado, esta circulação realiza-se no dia útil anterior (5ª feira).
    // Se 2ª feira for Feriado, a circulação de Domingo realiza-se antes à 2ª feira.
    // Esta circulação realiza-se na 2ª feira de Páscoa e na 3ª feira de Carnaval.
    "56DOM-2P-3C-5560": [
        { date: "20251130", type: 2 }, // vespera rest ind
        { date: "20251201", type: 1 }, // feriado: restauracao indep, 2a f

        { date: "20251207", type: 2 }, // vespera imaculada conceicao
        { date: "20251208", type: 1 }, // feriado: imaculada conceicao, 2a f

        { date: "20260402", type: 1 }, // vespera 6ª feira santa
        { date: "20260403", type: 2 }, // 6ª feira santa

        { date: "20260430", type: 1 }, // vespera dia do trabalhador
        { date: "20260501", type: 2 }, // feriado: dia do trabalhador, 6a f

        { date: "20260217", type: 1 }, // 3ª feira de Carnaval
        { date: "20260406", type: 1 }, // 2ª feira de Páscoa
    ],
};

export function getExceptionsForServiceId(
    serviceId: string,
    includeHeader: boolean = true
): string[] {
    const lines: string[] = [];
    if (includeHeader) lines.push("service_id,date,exception_type");

    for (const [part, entries] of Object.entries(
        DATE_RANGES_BY_SERVICE_ID_PARTS
    )) {
        if (!serviceId.includes(part)) continue;

        for (const entry of entries) {
            if ("date" in entry) {
                lines.push(`${serviceId},${entry.date},${entry.type}`);
            } else if ("range" in entry) {
                const [start, end] = entry.range;
                const cur = new Date(
                    `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(
                        6,
                        8
                    )}`
                );
                const endDate = new Date(
                    `${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6, 8)}`
                );

                while (cur <= endDate) {
                    const y = cur.getFullYear();
                    const m = String(cur.getMonth() + 1).padStart(2, "0");
                    const d = String(cur.getDate()).padStart(2, "0");
                    lines.push(`${serviceId},${y}${m}${d},${entry.type}`);
                    cur.setDate(cur.getDate() + 1);
                }
            }
        }
    }

    return lines;
}
