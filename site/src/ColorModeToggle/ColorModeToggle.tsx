import { useEffect, useState, createContext, useContext, ReactNode, useMemo } from "react";
import { Box } from "../theme/Box";
import * as styles from "./ColorModeToggle.css";
import { darkMode, lightMode } from "../theme/css/color-mode.css";

type ColorMode = typeof darkMode | typeof lightMode;
export const themeKey = "vanilla-theme-pref";

type ColorModeContextValues = {
    colorMode: ColorMode | null;
    setColorMode: (colorMode: ColorMode) => void;
};

export const ColorModeContext = createContext<ColorModeContextValues>({
    colorMode: null,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setColorMode: () => {},
});

export function ColorModeProvider({ children }: { children: ReactNode }) {
    const [colorMode, setColorMode] = useState<ColorMode | null>(null);

    useEffect(() => {
        setColorMode(document.documentElement.classList.contains(darkMode) ? darkMode : lightMode);
    }, []);

    return (
        <ColorModeContext.Provider
            value={useMemo(
                () => ({
                    colorMode,
                    setColorMode: (mode: ColorMode) => {
                        setColorMode(mode);

                        const className = mode === darkMode ? darkMode : lightMode;
                        document.documentElement.classList.remove(lightMode, darkMode);
                        document.documentElement.classList.add(className);

                        try {
                            localStorage.setItem(themeKey, className);
                        } catch {}
                    },
                }),
                [colorMode]
            )}
        >
            {children}
        </ColorModeContext.Provider>
    );
}

export const ColorModeToggle = () => {
    const { colorMode, setColorMode } = useContext(ColorModeContext);
    console.log({ colorMode });

    return (
        <Box
            as="button"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="full"
            cursor="pointer"
            className={styles.ColorModeButtonStyle}
            title="Toggle colour mode"
            aria-label="Color mode switch"
            onClick={() => setColorMode(colorMode === lightMode ? darkMode : lightMode)}
        />
    );
};
