import {
    Calendar,
    Line,
    Pattern,
    PatternException,
    PatternWithUnfixedExceptions,
    Stop,
} from "./opt-web.types.ts";

export class OptWebApiClient {
    url: string;
    providerName: string;

    constructor({ url, providerName }: { url: string; providerName: string }) {
        if (url.endsWith("/")) {
            url = url.slice(0, -1);
        }
        this.url = url;
        this.providerName = providerName;
    }

    #genApiKey() {
        const e = ["F", "C", "5", "Z", "H", "S", "W", "0", "8", "K"];
        const monthCodes = [
            "I",
            "2",
            "M",
            "O",
            "A",
            "C",
            "B",
            "F",
            "9",
            "K",
            "V",
            "Y",
        ];
        const dayCodes = ["T", "B", "D", "N", "0", "W", "R"];

        const n = Date.now().toString();
        let a = "";
        for (let i = 0; i < n.length; i++) {
            a += e[parseInt(n[i], 10)];
        }

        const now = new Date();
        const monthCode = monthCodes[now.getMonth()];
        const weekday = (now.getDay() + 6) % 7;
        const dayCode = dayCodes[(weekday - 6 + 7) % 7];

        return `${a}-${monthCode}${dayCode}`;
    }

    async #request(path: string, options: RequestInit = {}) {
        const url = `${this.url}${path}`;
        const headers = {
            ...options.headers,
            apikey: this.#genApiKey(),
        };
        const resp = await fetch(url, { ...options, headers });
        if (!resp.ok) {
            throw new Error(`request failed with ${resp.status}`);
        }
        return resp.json();
    }

    async #get<T>(path: string) {
        return this.#request(path, { method: "GET" }) as Promise<T>;
    }

    async #post<T>(path: string, body: any) {
        return this.#request(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }) as Promise<T>;
    }

    async getLines(): Promise<Line[]> {
        return this.#get<Line[]>(`/provider/lines/${this.providerName}`);
    }

    async getCalendars(lineId: string): Promise<Calendar[]> {
        return this.#get<Calendar[]>(`/schedule/${lineId}`);
    }

    async getPattern(
        lineId: string,
        direction: string,
        scheduleIds: number[]
    ): Promise<Pattern> {
        const unfixedPattern = (await this.#get<PatternWithUnfixedExceptions>(
            `/trip/${lineId}/${direction}/${scheduleIds.join(",")}`
        )) as PatternWithUnfixedExceptions;

        const fixedPattern: Pattern = {
            ...unfixedPattern,
            exceptions: unfixedPattern.exceptions.map((e) => {
                const [id, description] = e.split(")");

                return {
                    id,
                    description: description.trim(),
                } as PatternException;
            }),
        };

        return fixedPattern;
    }

    async getAllStops(): Promise<Stop[]> {
        return this.#get<Stop[]>(
            "/stop/39.50404057338466/-8.997802734375002/532887"
        );
    }
}
