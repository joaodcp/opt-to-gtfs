import { Line, Stop } from "./services/opt-web/opt-web.types";
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

export function optLinesToGtfsRoutes(lines: Line[]): string {
    const header =
        "route_id,route_short_name,route_long_name,route_color,normalized_route_long_name";
    const routeLines = lines.map((line) => {
        const routeId = line.id;
        const routeShortName = line.code;
        const routeLongName = line.name;
        const routeColor = line.lineColorFormatted
            ? toHexColor(line.lineColorFormatted)
            : "";
        const normalized_route_long_name = normalizeRouteName(routeLongName);

        return `${routeId},${routeShortName},${routeLongName},${routeColor},${normalized_route_long_name}`;
    });

    return [header, ...routeLines].join("\n");
}
