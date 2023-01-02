// adapted from https://github.com/maraisr/diary since it doesn't support ESM
import pc from "picocolors";
import util from "node:util";

util.inspect.defaultOptions.depth = 4;

const possibleColors = [
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "bgRed",
    "bgGreen",
    "bgYellow",
    "bgBlue",
    "bgMagenta",
    "bgCyan",
    "bgWhite",
] as const;
const possibleStyles = ["bold", "dim", "italic", "underline", "inverse"] as const;

export type LogEvent = {
    name: string;
    level: LogLevels;
    messages: unknown[];
    colorFn: (msg: string) => string;
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

if (__TARGET__ === "node" && process.env["DEBUG"]) enable(process.env["DEBUG"]);

// ~ Logger

const logger = (
    name: string,
    reporter: Reporter,
    level: LogLevels,
    colorFn: (msg: string) => string,
    ...messages: unknown[]
): void => {
    let len = namespaceLists.skips.length;
    for (len = namespaceLists.skips.length; len--; ) {
        if (namespaceLists.skips[len]?.test(name)) return;
    }

    for (len = namespaceLists.allows.length; len--; ) {
        if (namespaceLists.allows[len]?.test(name)) return void reporter({ name, level, colorFn, messages });
    }
};

// ~ Reporter

export const default_reporter: Reporter = (event) => {
    const fn = console[event.level === "fatal" ? "error" : event.level];
    return void fn(event.colorFn(pc.bold(event.name)), ...event.messages);
};

const isOdd = (x: number) => x % 2 !== 0;

// ~ Public api

let refCount = 0;
const scopedCache = new Map<string, CreateLoggerReturn>();

export function createLogger(name: string, onEmit?: Reporter): CreateLoggerReturn {
    onEmit = onEmit ?? default_reporter;
    const color = possibleColors[refCount % possibleColors.length]!;
    const style = isOdd(Math.floor(refCount / possibleStyles.length))
        ? possibleStyles[refCount % possibleStyles.length]!
        : undefined;
    const styleFn = style ? pc[style] : undefined;
    const colorFn = (msg: string) => (styleFn ? styleFn(pc[color](msg)) : pc[color](msg));
    refCount++;

    const logFn = logger.bind(0, name, onEmit, "debug", colorFn);

    return Object.assign(logFn, {
        extend: (scoped: string) => createLogger(`${name}:${scoped}`, onEmit),
        scoped: (scoped: string, ...messages: unknown[]) => {
            const namespace = `${name}:${scoped}`;
            const logger = scopedCache.get(namespace) ?? createLogger(namespace, onEmit);
            if (!scopedCache.has(namespace)) scopedCache.set(namespace, logger);

            logger(...messages);
        },
        lazy: (fn: () => any) => {
            logFn(fn());
        },
        lazyScoped: (scoped: string, fn: () => any) => {
            const namespace = `${name}:${scoped}`;
            const logger = scopedCache.get(namespace) ?? createLogger(namespace, onEmit);
            if (!scopedCache.has(namespace)) scopedCache.set(namespace, logger);

            logger(fn());
        },
    });
}

type CreateLoggerReturn = ((...args: unknown[]) => void) & {
    extend: (scoped: string) => CreateLoggerReturn;
    scoped: (scoped: string, ...messages: unknown[]) => void;
    lazy: (fn: () => any) => void;
    lazyScoped: (scoped: string, fn: () => any) => void;
};
