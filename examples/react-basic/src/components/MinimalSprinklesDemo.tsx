import { defineProperties } from "@box-extractor/vanilla-wind";

const minimalSprinkles = defineProperties({
    conditions: {
        idle: {},
        focus: { selector: "&:focus" },
        hover: { selector: "&:hover" },
    },
    properties: {
        position: true,
        display: true,
        color: {
            brand: "red",
            other: "blue",
        },
        backgroundColor: {
            main: "green",
            secondary: "blue",
            third: "pink",
        },
    },
    shorthands: {
        p: ["position"],
        d: ["display"],
    },
});

export const MinimalSprinklesDemo = () => {
    return (
        <div
            className={minimalSprinkles({
                color: "brand",
                backgroundColor: { hover: { idle: "#63b3ed", focus: "secondary" } },
            })}
        >
            color.brand
        </div>
    );
};
