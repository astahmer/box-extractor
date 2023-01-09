// adapted from https://github.com/maraisr/diary since it doesn't support ESM
// mixed with debug colors

import pc from "picocolors";
import util from "node:util";

util.inspect.defaultOptions.depth = 6;

export type LogEvent = {
    name: string;
    level: LogLevels;
    messages: unknown[];
    color: number;
};

type LogLevels = "fatal" | "error" | "warn" | "debug" | "info" | "log";
export type Reporter = (event: LogEvent) => void;

const __TARGET__ = "node";

const namespaceLists = {
    allows: [] as RegExp[],
    skips: [] as RegExp[],
};

const enable = (namespaces: string) => {
    let i;
    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split.length;

    const allows = [] as RegExp[];
    const skips = [] as RegExp[];

    for (i = 0; i < len; i++) {
        if (!split[i]) {
            // ignore empty strings
            continue;
        }

        namespaces = split[i]!.replace(/\*/g, ".*?");

        if (namespaces[0] === "-") {
            skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
        } else {
            allows.push(new RegExp("^" + namespaces + "$"));
        }
    }

    namespaceLists.allows = allows;
    namespaceLists.skips = skips;
};

const isEnabled = (name: string) => {
    let len = namespaceLists.skips.length;
    for (len = namespaceLists.skips.length; len--; ) {
        if (namespaceLists.skips[len]?.test(name)) return false;
    }

    for (len = namespaceLists.allows.length; len--; ) {
        if (namespaceLists.allows[len]?.test(name)) return true;
    }

    return false;
};

if (__TARGET__ === "node" && process.env["DEBUG"]) enable(process.env["DEBUG"]);

// ~ Logger

const logger = (
    name: string,
    reporter: Reporter,
    level: LogLevels,
    color: LogEvent["color"],
    ...messages: unknown[]
): void => {
    reporter({ name, level, color, messages });
};

/**
 * taken from debug
 * https://github.com/debug-js/debug/blob/d1616622e4d404863c5a98443f755b4006e971dc/src/browser.js#L27
 */
function selectColor(namespace: string): number {
    let hash = 0;

    for (let i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + (namespace.codePointAt(i) ?? 0);
        hash = Math.trunc(hash); // Convert to 32bit integer
    }

    return colors[Math.abs(hash) % colors.length]!;
}

const colors = [
    20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92,
    93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172,
    173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221,
];

const withColor = (color: LogEvent["color"], str: string) => {
    const colorCode = "\u001B[3" + (color < 8 ? color : "8;5;" + color);
    return `${colorCode};1m${str} \u001B[0m`;
};

// ~ Reporter

export const default_reporter: Reporter = (event) => {
    const fn = console[event.level === "fatal" ? "error" : event.level];
    const color = event.color;

    fn(pc.bold(withColor(color, event.name)), ...event.messages);
};

// ~ Public api

const scopedCache = new Map<string, CreateLoggerReturn>();
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export function createLogger(name: string, _onEmit?: Reporter): CreateLoggerReturn {
    const onEmit = _onEmit ?? default_reporter;
    const color = selectColor(name);
    const logFn = isEnabled(name) ? logger.bind(0, name, onEmit, "debug", color) : noop;

    return Object.assign(logFn, {
        extend: (scoped: string) => createLogger(`${name}:${scoped}`, onEmit),
        scoped: (scoped: string, ...messages: unknown[]) => {
            const namespace = `${name}:${scoped}`;
            const loggerFn = scopedCache.get(namespace) ?? createLogger(namespace, onEmit);
            if (!scopedCache.has(namespace)) scopedCache.set(namespace, loggerFn);

            loggerFn(...messages);
        },
        lazy: (fn: () => any) => {
            logFn(fn());
        },
        lazyScoped: (scoped: string, fn: () => any) => {
            const namespace = `${name}:${scoped}`;
            const loggerFn = scopedCache.get(namespace) ?? createLogger(namespace, onEmit);
            if (!scopedCache.has(namespace)) scopedCache.set(namespace, loggerFn);

            loggerFn(fn());
        },
    });
}

type CreateLoggerReturn = ((...args: unknown[]) => void) & {
    extend: (scoped: string) => CreateLoggerReturn;
    scoped: (scoped: string, ...messages: unknown[]) => void;
    lazy: (fn: () => any) => void;
    lazyScoped: (scoped: string, fn: () => any) => void;
};

/**
 * taken from vite
 * https://github.com/vitejs/vite/blob/167753d3754507430600a1bc2b100ca321b17a86/packages/vite/src/node/utils.ts#L360
 */
export function timeFrom(start: number, subtract = 0): string {
    const time: number | string = performance.now() - start - subtract;
    const timeString = (time.toFixed(2) + "ms").padEnd(5, " ");
    if (time < 10) {
        return pc.green(timeString);
    } else if (time < 50) {
        return pc.yellow(timeString);
    } else {
        return pc.red(timeString);
    }
}

// const printColors = () => {
//     for (let i = 0; i < 16; i++) {
//         for (let j = 0; j < 16; j++) {
//             const color = i * 16 + j;
//             process.stdout.write(`\u001B[38;5;${color}m${String(color).padEnd(4)}\u001B[0m`);
//         }

//         console.log("");
//     }

//     for (let i = 0; i < 16; i++) {
//         for (let j = 0; j < 16; j++) {
//             const color = i * 16 + j;
//             process.stdout.write(`\u001B[48;5;${color}m${String(color).padEnd(4)}\u001B[0m`);
//         }

//         console.log("");
//     }

// }
