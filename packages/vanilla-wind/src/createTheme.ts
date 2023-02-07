// start vanilla-extract/packages/private
type CSSVarFunction = `var(--${string})` | `var(--${string}, ${string | number})`;
export type Contract = {
    [key: string]: CSSVarFunction | null | Contract;
};
type Primitive$1 = string | boolean | number | null | undefined;
export type MapLeafNodes<Obj, LeafType> = {
    [Prop in keyof Obj]: Obj[Prop] extends Primitive$1
        ? LeafType
        : Obj[Prop] extends Record<string | number, any>
        ? MapLeafNodes<Obj[Prop], LeafType>
        : never;
};

// end vanilla-extract/packages/private

// start vanilla-extract/packages/css/src/types.ts
type NullableTokens = {
    [key: string]: string | NullableTokens | null;
};

type Tokens = {
    [key: string]: string | Tokens;
};

type ThemeVars<ThemeContract extends NullableTokens> = MapLeafNodes<ThemeContract, CSSVarFunction>;

// end vanilla-extract/packages/css/src/types.ts

/** Create theme contract -> createThemeContract */
export function createTheme<ThemeContract extends Contract>(
    mode: "contract",
    themeContract: ThemeContract
): MapLeafNodes<ThemeContract, string>;
// TODO ?
/** Create global theme contract -> createGlobalThemeContract */
// export function createTheme<ThemeContract extends Contract>(
//     mode: "contract",
//     themeContract: ThemeContract
// ): MapLeafNodes<ThemeContract, string>;
/** Create global theme bound to a selector -> createGlobalTheme basic */
export function createTheme<ThemeTokens extends Tokens>(selector: string, tokens: ThemeTokens): ThemeVars<ThemeTokens>;
/** Create global theme bound to a selector from another theme contract -> createGlobalTheme from another theme contract */
export function createTheme<ThemeContract extends Contract>(
    selector: string,
    themeContract: ThemeContract,
    tokens: MapLeafNodes<ThemeContract, string>
): void;
/** Create theme and return a className that you have to bind where you want to use it -> createTheme basic */
export function createTheme<ThemeTokens extends Tokens>(
    tokens: ThemeTokens,
    debugId?: string
): [className: string, vars: ThemeVars<ThemeTokens>];
/** Create theme from another theme contract and return a className that you have to bind where you want to use it -> createTheme from another theme contract */
export function createTheme<ThemeContract extends Contract>(
    themeContract: ThemeContract,
    tokens: MapLeafNodes<ThemeContract, string>,
    debugId?: string
): string;
export function createTheme(_arg1: any, _arg2?: any, _arg3?: any): any {
    // createThemeContract / createGlobalThemeContract
    if (_arg1 === "contract") {
        // createGlobalThemeContract
        if (typeof _arg2 === "string") {
            return _arg3;
        }

        // createThemeContract
        return _arg2;
    }

    // createGlobalTheme
    if (typeof _arg1 === "string") {
        // createGlobalTheme from another theme contract
        if (_arg3) {
            return _arg2;
        }

        // createGlobalTheme basic

        return;
    }

    // createTheme from another theme contract
    if (typeof _arg2 === "object") {
        return _arg1;
    }

    // createTheme basic
    return ["", _arg1];
}
