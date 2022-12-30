// inlined from https://github.com/maraisr/diary since it doesn't support ESM
import pc from "picocolors";
import util from "node:util";

util.inspect.defaultOptions.depth = 4;

const colors = {
    fatal: pc.red,
    error: pc.red,
    warn: pc.yellow,
    debug: pc.blue,
    info: pc.green,
    log: pc.white,
} as const;

export type LogEvent = {
    name: string;
    level: LogLevels;

    messages: unknown[];

    [other: string]: any;
};

export type Reporter = (event: LogEvent) => void;

type LogFn = {
    <T extends object>(message: T, ...args: unknown[]): void;
    <T extends Error>(message: T, ...args: unknown[]): void;
    (message: unknown, ...args: unknown[]): void;
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    (message: string, ...args: unknown[]): void;
};

export type LogLevels = "fatal" | "error" | "warn" | "debug" | "info" | "log";
export type Diary = Record<LogLevels, LogFn>;

const __TARGET__ = "node";

let allows: RegExp[] = [];

const to_reg_exp = (x: string) => new RegExp(x.replace(/\*/g, ".*") + "$");

export const enable = (allows_query: string) => {
    allows = allows_query.split(/[\s,]+/).map(to_reg_exp);
};

if (__TARGET__ === "node" && process.env["DEBUG"]) enable(process.env["DEBUG"]);

// ~ Logger

const logger = (name: string, reporter: Reporter, level: LogLevels, ...messages: unknown[]): void => {
    for (let len = allows.length; len--; ) {
        if (allows[len]?.test(name)) return void reporter({ name, level, messages });
    }
};

// ~ Reporter

const loglevel_strings: Record<LogLevels, string> = /*#__PURE__*/ {
    fatal: "✗ fatal",
    error: "✗ error",
    warn: "‼ warn ",
    debug: "● debug",
    info: "ℹ info ",
    log: "◆ log  ",
} as const;

export const default_reporter: Reporter = (event) => {
    let label = "";
    const fn = console[event.level === "fatal" ? "error" : event.level];
    const colorFn = colors[event.level];

    if (__TARGET__ === "node") label = `${loglevel_strings[event.level]} `;
    if (event.name) label += `[${event.name}] `;

    if (__TARGET__ === "node") {
        let message = event.messages;
        const maybe_error = event.messages[0];

        if (maybe_error instanceof Error && typeof maybe_error.stack !== "undefined") {
            const m = maybe_error.stack.split("\n");
            m.shift();
            message = [`${maybe_error.message}\n${m.join("\n")}`];
        }

        return void fn(colorFn(pc.bold(label)), ...message);
    }

    if (typeof event.messages[0] === "object") {
        return void fn(label, ...event.messages);
    } else {
        const message = event.messages.shift();
        return void fn(label + message, ...event.messages);
    }
};

// ~ Public api

type LogThunk = (...args: unknown[]) => unknown;

export const diary = (name: string, onEmit?: Reporter) => {
    onEmit = onEmit ?? default_reporter;
    const logFn = logger.bind(0, name, onEmit, "debug");

    function diaryFn(fn: LogThunk): void;
    function diaryFn(scoped: string, fn: LogThunk): void;
    function diaryFn(scopedOrFn: string | LogThunk, maybeFn?: LogThunk): void {
        if (process.env["DEBUG"]) {
            if (typeof scopedOrFn === "string") {
                const scoped = `${name}:${scopedOrFn}`;
                const logFn = logger.bind(0, scoped, onEmit!, "debug");
                logFn(maybeFn!());
                return;
            }

            logFn(scopedOrFn());
        }
    }

    return Object.assign(diaryFn, {
        extend: (scoped: string) => diary(`${name}:${scoped}`, onEmit),
    });
};
