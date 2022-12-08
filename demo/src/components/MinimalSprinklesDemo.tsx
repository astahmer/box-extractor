import { minimalSprinkles } from "./minimalSprinkles.css";

export const MinimalSprinklesDemo = () => {
    return (
        <div
            className={minimalSprinkles({
                color: "brand",
                backgroundColor: "secondary",
                position: "absolute",
                display: "flex",
            })}
        >
            color.brand
        </div>
    );
};
