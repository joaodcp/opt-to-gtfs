import { OptWebApiClient } from "./services/opt-web/opt-web.service";
import { optPatternsToGtfsStopTimes, optPatternToGtfsTrips } from "./to-gtfs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const taaClient = new OptWebApiClient({
    url: "https://www.transportesaltoalentejo.pt/",
    providerName: "TAA",
});

const taaLines = await taaClient.getLines();

const taaStops = await taaClient.getAllStops();

// const seenExceptionDescriptions = new Set<string>();
// const seenCalendarNames = new Set<string>();

// for (const line of taaLines) {
//     console.log(`Processing line ${line.id} - ${line.name}`);
//     const lineCalendars = await taaClient.getCalendars(line.id);

//     for (const direction of line.directions) {
//         console.log(`Processing direction ${direction} for line ${line.id}`);
//         for (const cal of lineCalendars) {
//             seenCalendarNames.add(cal.name);
//             const pattern = await taaClient.getPattern(
//                 line.id,
//                 direction,
//                 cal.schedules
//             );
//             for (const ex of pattern.exceptions) {
//                 seenExceptionDescriptions.add(ex.description);
//                 console.log(ex.description);
//             }
//             await sleep(1000);
//         }
//     }
// }

// console.log("Seen exception descriptions:");
// seenExceptionDescriptions.forEach((desc) => console.log(desc));

// console.log("Seen calendar names:");
// seenCalendarNames.forEach((name) => console.log(name));

// const calendars = await taaClient.getCalendars("8778");

// const pattern = await taaClient.getPattern("8778", "G", calendars[0].schedules);

// console.log(
//     optPatternToGtfsTrips(
//         "63_4",
//         taaLines.find((line) => line.id === "8778")!,
//         "G",
//         calendars[0],
//         pattern
//     )
// );

// console.log("ST");
// console.log(
//     optPatternsToGtfsStopTimes(
//         "63_4",
//         taaLines.find((line) => line.id === "8778")!,
//         "G",
//         calendars[0],
//         pattern
//     )
// );

import fs from "fs";

const trips = fs.readFileSync(
    `gtfs-out/${taaClient.providerName}/trips.txt`,
    "utf-8"
);

const seenServiceIds = new Set<string>();
for (const line of trips.split("\n").slice(1)) {
    seenServiceIds.add(line.match(/"(.*?)"/)![1]);
}

console.log("Seen service IDs:", seenServiceIds.size);
seenServiceIds.forEach((id) => console.log(id));
