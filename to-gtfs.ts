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

export function optLinesToGtfsRoutes(lines: Line[], routeType: string): string {
    const header =
        "route_id,route_short_name,route_long_name,route_color,route_type,normalized_route_long_name";
    const routeLines = lines.map((line) => {
        const routeId = line.id;
        const routeShortName = line.code;
        const routeLongName = line.name;
        const routeColor = line.lineColorFormatted
            ? toHexColor(line.lineColorFormatted)
            : "";
        const normalized_route_long_name = normalizeRouteName(routeLongName);

        return `${routeId},${routeShortName},${routeLongName},${routeColor},${routeType},${normalized_route_long_name}`;
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
    const tripLines = pattern.trips.map((tripStops) => {
        const directionId = direction === "G" ? 0 : 1;
        const routeId = line.id;
        const exceptionsDescriptions = tripStops[0].exceptions
            .map(
                (d) => pattern.exceptions.find((ex) => ex.id === d)?.description
            )
            .filter((desc) => desc)
            .join(";");
        const serviceId = exceptionsDescriptions
            ? `${calendar.name} (${exceptionsDescriptions})`
            : calendar.name;
        const tripId = `${tripPrefix}_${line.code}_${directionId}_${tripStops[0].time}`;

        return `${routeId},${optServiceNameToGtfsCalendarId(
            serviceId
        )},${tripId},${directionId}`;
    });

    if (!includeHeader) {
        return tripLines.join("\n");
    }

    return [header, ...tripLines].join("\n");
}

export function optPatternsToGtfsStopTimes(
    tripPrefix: string,
    line: Line,
    direction: "G" | "R",
    calendar: Calendar,
    pattern: Pattern,
    includeHeader = true
): string {
    const header =
        "trip_id,arrival_time,departure_time,stop_id,stop_sequence,timepoint";
    const stopTimeLines: string[] = [];

    const directionId = direction === "G" ? 0 : 1;
    const routeId = line.id;
    const serviceId = calendar.name;

    pattern.trips.forEach((tripSteps) => {
        const tripId = `${tripPrefix}_${line.code}_${directionId}_${tripSteps[0].time}`;

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
        return stopTimeLines.join("\n");
    }
    return [header, ...stopTimeLines].join("\n");
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
        "56-DOM-R5660",
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
