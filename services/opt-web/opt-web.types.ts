export interface Line {
    id: string;
    code: string;
    name: string;
    goName: string | null;
    returnName: string;
    directions: string[];
    provider: string;
    lineColor: number;
    lineColorFormatted: {
        r: number;
        g: number;
        b: number;
        a: number;
    } | null;
}

export interface Calendar {
    name: string;
    schedules: number[];
}

export interface PatternWithUnfixedExceptions {
    stops: PatternStop[];
    trips: PatternStopPoint[][];
    exceptions: string[];
}

export interface Pattern {
    stops: PatternStop[];
    trips: PatternStopPoint[][];
    exceptions: PatternException[];
}

export interface PatternException {
    id: string;
    description: string;
}

export interface PatternStop {
    id: number;
    name: string;
    order: number;
    code: string;
}

export interface PatternStopPoint {
    stopId: number;
    stopOrder: number;
    time: string; // "HH:MM"
    exceptions: string[]; // dates in "YYYY-MM-DD" format
}

export interface Stop {
    id: number;
    name: string;
    code: string;
    type: number;
    coordX: number;
    coordY: number;
    provider: string;
    restriction: number;
    regions: number[];
    description: string | null;
    transportType: number;
    cluster: string | null;
}
