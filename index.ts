import { OptWebApiClient } from "./services/opt-web/opt-web.service";
import fs from "fs";
import { optLinesToGtfsRoutes, optStopsToGtfsStops } from "./to-gtfs";

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

fs.writeFileSync(
    `gtfs-out/${taaClient.providerName}/routes.txt`,
    optLinesToGtfsRoutes(taaLines)
);
fs.writeFileSync(
    `gtfs-out/${taaClient.providerName}/stops.txt`,
    optStopsToGtfsStops(taaStops)
);

const tpacLines = await tpacClient.getLines();

const tpacStops = await tpacClient.getAllStops();

fs.writeFileSync(
    `gtfs-out/${tpacClient.providerName}/routes.txt`,
    optLinesToGtfsRoutes(tpacLines)
);
fs.writeFileSync(
    `gtfs-out/${tpacClient.providerName}/stops.txt`,
    optStopsToGtfsStops(tpacStops)
);

const trimbalLines = await trimbalClient.getLines();

const trimbalStops = await trimbalClient.getAllStops();

fs.writeFileSync(
    `gtfs-out/${trimbalClient.providerName}/routes.txt`,
    optLinesToGtfsRoutes(trimbalLines)
);
fs.writeFileSync(
    `gtfs-out/${trimbalClient.providerName}/stops.txt`,
    optStopsToGtfsStops(trimbalStops)
);

const talLines = await talClient.getLines();

const talStops = await talClient.getAllStops();

fs.writeFileSync(
    `gtfs-out/${talClient.providerName}/routes.txt`,
    optLinesToGtfsRoutes(talLines)
);
fs.writeFileSync(
    `gtfs-out/${talClient.providerName}/stops.txt`,
    optStopsToGtfsStops(talStops)
);
