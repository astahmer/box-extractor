/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
import { PropsWithChildren, useState } from "react";
import { ColorSprinkles, colorSprinkles } from "./colors.css";
// import { DessertBox } from "../theme/DessertBox";

const staticColor = "gray.100" as const;
const staticColor2 = "gray.200" as any;
const staticColor3 = "gray.300" as any;

const dynamicColorName = "something";
const nestedReference = { ref: dynamicColorName } as const;
const deepReference = nestedReference.ref;

const dynamicElement = "staticColor";
const dynamicPart1 = "static";
const dynamicPart2 = "Color";
const dynamicPartsAsTemplateString = `${dynamicPart1}${dynamicPart2}` as const;
const withDynamicPart = {
    dynamicPart1,
    dynamicPart2: dynamicPart2,
};

const dynamicName = "dynamicColor";
const dynamicLiteralColor = "gray.900";

const colorMap = {
    staticColor,
    literalColor: "gray.600",
    [dynamicColorName]: "gray.700",
    [deepReference]: "gray.800",
    [dynamicName]: dynamicLiteralColor,
};

const secondRef = "secondLevel";
const wrapperMap = {
    [secondRef]: dynamicElement,
    thirdRef: withDynamicPart.dynamicPart1,
    fourthRef: withDynamicPart["dynamicPart2"],
};
const dynamicAttribute = "borderColor";
const objectWithAttributes = { color: "blackAlpha.400" } as any;

const dynamicColor = colorMap[dynamicElement];
const array = ["pink.100"];
const strIndex = "0";
const numberIndex = 0;

export const Demo = () => {
    const [isShown, setIsShown] = useState(false);

    // const [controlledColor, setControlledColor] = useState("gray.400" as any);
    // const [dynamicVarColor, setDynamicVarColor] = useState("gray.500" as any);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", margin: "auto" }}>
                <div style={{ textAlign: "center", fontSize: "50px" }}>Ready to go</div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h1>{isShown ? "Shown" : "Hidden"}</h1>
                    <div>
                        <input type="checkbox" onChange={() => setIsShown((current) => !current)} />
                    </div>
                    {/* <DessertBox>box</DessertBox> */}
                    <div className={colorSprinkles({ color: "blue.100" })}>blue100 without ColorBox</div>
                    {/* self closing */}

                    <ColorBox color="yellow.100">yellow.100</ColorBox>
                    <ColorBox color={{ default: "red.100", hover: "green.100", focus: "blue.100" }}>
                        conditional rgb
                    </ColorBox>
                    <ColorBox backgroundColor={{ default: "orange.800", hover: "telegram.200", focus: "yellow.700" }}>
                        conditional rgb
                    </ColorBox>

                    {/* unlikely this will ever be supported (unless ezno delivers) */}
                    {/* <ColorBox color={controlledColor}>controlledColor</ColorBox>
                    <div onClick={() => setDynamicVarColor("gray.600")}>
                        <ColorBox color={dynamicVarColor}>dynamicVarColor</ColorBox>
                    </div> */}

                    {/* uncomment to import the big theme sprinkles */}
                    {/* <DessertBox color="blackAlpha.200"></DessertBox>
                    <DessertBox color="blackAlpha.300"></DessertBox>
                    <DessertBox color="blackAlpha.400"></DessertBox> */}
                </div>
            </div>
        </div>
    );
};

const ColorBox = ({ children, ...props }: PropsWithChildren<ColorSprinkles>) => {
    return <div className={colorSprinkles(props)} children={children} />;
};

// const Box = ColorBox
