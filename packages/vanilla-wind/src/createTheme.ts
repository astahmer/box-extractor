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

export function createTheme<ThemeTokens extends Tokens>(
    tokens: ThemeTokens,
    debugId?: string
): [className: string, vars: ThemeVars<ThemeTokens>];
export function createTheme<ThemeContract extends Contract>(
    themeContract: ThemeContract,
    tokens: MapLeafNodes<ThemeContract, string>,
    debugId?: string
): string;
export function createTheme(_arg1: any, _arg2?: any, _arg3?: string): any {
    return "";
}
