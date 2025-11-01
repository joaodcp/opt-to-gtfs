import { OptWebApiClient } from "./services/opt-web/opt-web.service";
import fs from "fs";
import {
    optLinesToGtfsRoutes,
    optPatternsToGtfsStopTimes,
    optPatternToGtfsTrips,
    optPatternToGtfsTripsAndCalendarDates,
    optStopsToGtfsStops,
} from "./to-gtfs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ROUTE_TYPE_BUS = "3";

// Alentejo
const tpacClient = new OptWebApiClient({
    url: "https://tpac.pt/",
    providerName: "TAC",
});

const taaClient = new OptWebApiClient({
    url: "https://www.transportesaltoalentejo.pt/",
    providerName: "TAA",
});

const trimbalClient = new OptWebApiClient({
    url: "https://www.trimbal.pt/",
    providerName: "TRIMBAL",
});

const talClient = new OptWebApiClient({
    url: "https://www.transportesalentejolitoral.pt/",
    providerName: "AVEROMAR",
});

const taaLines = await taaClient.getLines();

const taaStops = await taaClient.getAllStops();

const taaTrips: string[] = [];
const taaStopTimes: string[] = [];
const taaCalendarDates: string[] = [];

const processedServiceIds: string[] = [];
const processedTripIds: string[] = [];

for (const line of taaLines) {
    console.log(`processing line ${line.id} - ${line.name}`);

    await Promise.all(
        line.directions.map(async (direction) => {
            console.log(
                `processing direction ${direction} for line ${line.id}`
            );
            const calendars = await taaClient.getCalendars(line.id);
            for (const cal of calendars) {
                const pattern = await taaClient.getPattern(
                    line.id,
                    direction,
                    cal.schedules
                );
                const [
                    tripLines,
                    calendarDatesLines,
                    currentProcessedTripIds,
                    currentProcessedServiceIds,
                ] = optPatternToGtfsTripsAndCalendarDates(
                    "63_4",
                    line,
                    direction as "G" | "R",
                    cal,
                    pattern,
                    taaTrips.length === 0,
                    processedTripIds,
                    processedServiceIds
                );

                processedTripIds.push(...currentProcessedTripIds);
                processedServiceIds.push(...currentProcessedServiceIds);

                console.log(tripLines);

                taaTrips.push(tripLines);
                taaCalendarDates.push(calendarDatesLines);

                taaStopTimes.push(
                    optPatternsToGtfsStopTimes(
                        "63_4",
                        line,
                        direction as "G" | "R",
                        cal,
                        pattern,
                        taaStopTimes.length === 0
                    )
                );
            }
        })
    );

    await sleep(1000);
}

// fs.writeFileSync(
//     `gtfs-out/${taaClient.providerName}/routes.txt`,
//     optLinesToGtfsRoutes(taaLines, ROUTE_TYPE_BUS)
// );
// fs.writeFileSync(
//     `gtfs-out/${taaClient.providerName}/stops.txt`,
//     optStopsToGtfsStops(taaStops)
// );

fs.writeFileSync(
    `gtfs-out/${taaClient.providerName}/trips.txt`,
    taaTrips.join("\n")
);

fs.writeFileSync(
    `gtfs-out/${taaClient.providerName}/stop_times.txt`,
    taaStopTimes.join("\n")
);

fs.writeFileSync(
    `gtfs-out/${taaClient.providerName}/calendar_dates.txt`,
    taaCalendarDates.filter(Boolean).join("\n") // temp fix to avoid empty lines
);

// const tpacLines = await tpacClient.getLines();

// const tpacStops = await tpacClient.getAllStops();

// fs.writeFileSync(
//     `gtfs-out/${tpacClient.providerName}/routes.txt`,
//     optLinesToGtfsRoutes(tpacLines)
// );
// fs.writeFileSync(
//     `gtfs-out/${tpacClient.providerName}/stops.txt`,
//     optStopsToGtfsStops(tpacStops)
// );

// const trimbalLines = await trimbalClient.getLines();

// const trimbalStops = await trimbalClient.getAllStops();

// fs.writeFileSync(
//     `gtfs-out/${trimbalClient.providerName}/routes.txt`,
//     optLinesToGtfsRoutes(trimbalLines)
// );
// fs.writeFileSync(
//     `gtfs-out/${trimbalClient.providerName}/stops.txt`,
//     optStopsToGtfsStops(trimbalStops)
// );

// const talLines = await talClient.getLines();

// const talStops = await talClient.getAllStops();

// fs.writeFileSync(
//     `gtfs-out/${talClient.providerName}/routes.txt`,
//     optLinesToGtfsRoutes(talLines)
// );
// fs.writeFileSync(
//     `gtfs-out/${talClient.providerName}/stops.txt`,
//     optStopsToGtfsStops(talStops)
// );
