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
