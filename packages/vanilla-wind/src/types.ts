import type { Properties } from "csstype";

export type CSSProperties = {} & Properties;

// Configuration

export type CssPropValue<Name extends keyof CSSProperties> = Record<string, CSSProperties[Name]>;
export type DynamicProp<Name extends keyof CSSProperties> = CssPropValue<Name> | true;

export type ConfigDynamicProperties = {
    [Prop in keyof CSSProperties]?: DynamicProp<Prop> | undefined;
};
export type DynamicPropName = keyof ConfigDynamicProperties;

export type ConfigConditions = {
    [conditionName: string]: {
        "@media"?: string;
        "@supports"?: string;
        "@container"?: string;
        selector?: string;
    };
};
