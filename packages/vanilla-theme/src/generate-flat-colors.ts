import fs from "node:fs";
import { colors } from "./color-palette";

const main = () => {
    const flatColors = flatMapColorsWithVariants(colors);

    fs.writeFileSync("./flat-colors2.ts", `export const flatColors = ${JSON.stringify(flatColors, null, 4)} as const;`);
};

main();

// Inspired by https://github.com/kesne/vanilla-tailwind/blob/main/src/theme.css.ts
function chakraColorVariantsToRecordOfAppThemeColorKeys(name: string) {
    return Object.fromEntries(
        Object.entries((colors as any)[name]).map(([num, value]) => [
            num === "DEFAULT" ? name : `${name}.${num}`,
            value,
        ])
    );
}

function flatMapColorsWithVariants(themeColors: Record<string, string | Record<string | number, string | number>>) {
    const themeMap = {} as Record<string, string>;

    let key: keyof typeof themeColors;
    for (key in themeColors) {
        if (typeof themeColors[key] === "string") {
            themeMap[key] = (themeColors[key] as string) + " !important";
        } else {
            const colorMap = chakraColorVariantsToRecordOfAppThemeColorKeys(key);
            for (const colorVariant in colorMap) {
                themeMap[colorVariant] = colorMap[colorVariant] + " !important";
            }
        }
    }

    return themeMap;
}
