import type { SprinklesConditions } from "./sprinkle-types";
import type { Conditions, SprinklesProperties } from "./types";

export const getSprinklesConfig = <Props extends readonly SprinklesProperties[]>(configs: Props) => {
    const properties = new Set<string>();
    const shorthands = new Map<string, string[]>();
    const conditions = [] as Array<Conditions["conditions"]>;

    configs.forEach((sprinkle) => {
        if (sprinkle.conditions) {
            conditions.push(sprinkle.conditions);
        }

        Object.entries(sprinkle.styles).forEach(([propName, compiledSprinkle]) => {
            properties.add(propName);

            if ("mappings" in compiledSprinkle) {
                shorthands.set(propName, compiledSprinkle.mappings as any);
            }
        });
    });

    return {
        properties,
        conditions: conditions as any as SprinklesConditions<Props>,
        shorthands,
    };
};
