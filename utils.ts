export function toHexColor({
    r,
    g,
    b,
    a,
}: {
    r: number;
    g: number;
    b: number;
    a: number;
}): string {
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`;
}

const ROUTE_NORMALIZATION_STATIC_REPLACES = {
    CEMITERIO: "Cemitério",
    GAVIAO: "Gavião",
    ANTONIO: "António",
    ARRAO: "Arrão",
    CHAO: "Chão",
    "MONTEMOR O NOVO": "Montemor-o-Novo",
    "MONTEMOR-O-NOVO": "Montemor-o-Novo",
    CIRCULACAO: "circulação",
    EVORA: "Évora",
    LOCARIO: "Locário",
    ANDRE: "André",
    "PONTE SOR": "Ponte de Sor",
    "S.PEDRO": "S. Pedro",
};

export function normalizeRouteName(routeName: string): string {
    if (!routeName) return "";

    let replaced = routeName;

    // replace p/ with "via " and collapse multiple spaces
    replaced = replaced.replace(/p\//gi, "via ").replace(/\s+/g, " ").trim();
    replaced = replaced.replaceAll(" POR ", " via ");
    replaced = replaced.replaceAll("POR ", "via ");

    // capitalize words except da, de, do, via
    replaced = replaced
        .toLowerCase()
        .split(" ")
        .map((word) => {
            if (["da", "de", "do", "via"].includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");

    // apply static replacements case-insensitively
    for (const [key, value] of Object.entries(
        ROUTE_NORMALIZATION_STATIC_REPLACES
    )) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        replaced = replaced.replace(regex, value);
    }

    return replaced;
}

const WEEKDAYS_INDEX_MAP: { [key: string]: number } = {
    "segunda-feira": 0,
    segunda: 0,
    "terça-feira": 1,
    terça: 1,
    "quarta-feira": 2,
    quarta: 2,
    "quinta-feira": 3,
    quinta: 3,
    "sexta-feira": 4,
    sexta: 4,
    sábado: 5,
    domingo: 6,
};

export function parseCalendarNameToWeekdaysCsvString(
    calendarName: string
): string {
    if (calendarName === "Dias Úteis") return "1,1,1,1,1,0,0";

    if (calendarName.includes(" a ")) {
        const [startDay, endDay] = calendarName
            .split(" a ")
            .map((part) => part.trim().toLowerCase());
        const startIndex = WEEKDAYS_INDEX_MAP[startDay];
        const endIndex = WEEKDAYS_INDEX_MAP[endDay];
        if (startIndex !== undefined && endIndex !== undefined) {
            const weekdaysArray = Array(7).fill(0);
            for (let i = startIndex; i <= endIndex; i++) {
                weekdaysArray[i] = 1;
            }
            return weekdaysArray.join(",");
        }
    }

    const weekDays = calendarName.split("|").map((part) => part.trim());
    const weekdaysArray = Array(7).fill(0);
    for (const day of weekDays) {
        const index = WEEKDAYS_INDEX_MAP[day.toLowerCase()];
        if (index !== undefined) {
            weekdaysArray[index] = 1;
        }
    }
    return weekdaysArray.join(",");
}
