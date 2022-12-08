import { themeSprinkles } from "../theme/sprinkles.css";

export const VanillaThemeDemo = () => {
    return <div className={themeSprinkles({ top: "0", left: "0" })}>top.0 / left.0</div>;
};
