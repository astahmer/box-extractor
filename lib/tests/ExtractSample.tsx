/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
import { PropsWithChildren, useState } from "react";
import { ColorSprinkes, colorSprinkes } from "./colors.css";
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

const getColorConfig = () => ({ color: "twitter.100", backgroundColor: "twitter.200" });

// TODO dynamic attribute retrieved using IIFE / function call (also try it in spread expressions)

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
                    <div className={colorSprinkes({ color: "blue.100" })}>blue100 without ColorBox</div>
                    {/* self closing */}
                    <ColorBox color="red.200" />

                    {/* jsxopeningelement */}
                    <ColorBox color="yellow.300" backgroundColor="blackAlpha.100">
                        yellow.300 with children
                    </ColorBox>
                    <ColorBox color={isShown ? "cyan.400" : "cyan.500"}>ternary</ColorBox>
                    <ColorBox color={"facebook.400"}>string in expression</ColorBox>
                    <ColorBox color={staticColor}>staticColor</ColorBox>
                    <ColorBox color={1 === 1 ? "facebook.500" : staticColor3}>staticColor ternary</ColorBox>
                    <ColorBox color={isShown ? "facebook.600" : staticColor2}>staticColor ternary</ColorBox>
                    {/* gray200/gray300 */}
                    <ColorBox color={isShown ? staticColor2 : staticColor3}>staticColor ternary</ColorBox>
                    {/* gray100 */}
                    <ColorBox color={colorMap.staticColor}>colorMap dot staticColor</ColorBox>
                    <ColorBox color={{ staticColor: "facebook.900" }["staticColor"]}>
                        colorMap bracket staticColor
                    </ColorBox>
                    <ColorBox color={["facebook.900"][0]}></ColorBox>
                    <ColorBox color={array[0]}></ColorBox>
                    <ColorBox color={array[strIndex]}></ColorBox>
                    <ColorBox color={array[numberIndex]}></ColorBox>
                    <ColorBox color={(array as any)?.[0] as any}></ColorBox>
                    <ColorBox color={[array[0]]![0]}></ColorBox>
                    <ColorBox color={[{ staticColor: "facebook.900" }][0]["staticColor"]}></ColorBox>
                    <ColorBox color={[{ staticColor: "facebook.900" }]?.[0]?.["staticColor"]}></ColorBox>
                    <ColorBox color={([{ staticColor: "facebook.900" }]! as any)[0]!["staticColor"]}></ColorBox>
                    <ColorBox color={colorMap["staticColor"]}>colorMap bracket staticColor</ColorBox>
                    <ColorBox color={colorMap["static" + "Color"] as any}>
                        colorMap bracket binary expression with 2 string literal
                    </ColorBox>
                    <ColorBox color={colorMap["static" + `${"Color"}`] as any}>
                        colorMap bracket binary expression with 1 string literal & 1 template string using string
                        literal
                    </ColorBox>
                    <ColorBox color={colorMap["static" + `${dynamicPart2}`] as any}>
                        colorMap bracket binary expression with 1 string literal & 1 template string using identifier
                    </ColorBox>
                    <ColorBox color={colorMap[`${dynamicPartsAsTemplateString}`]}>
                        colorMap bracket template string using nested template string
                    </ColorBox>
                    <ColorBox color={colorMap[("static" as any) + `${withDynamicPart["dynamicPart2"]}`] as any}>
                        colorMap bracket binary expression with 1 string literal & as expression & 1 template string
                        using identifier
                    </ColorBox>
                    <ColorBox color={colorMap[dynamicPart1 + "Color"]!}>
                        colorMap bracket binary expression with 1 string literal & 1 identifier and exclamation mark
                    </ColorBox>
                    <ColorBox color={colorMap[dynamicPart1 + dynamicPart2]}>
                        colorMap bracket binary expression with 2 identifier
                    </ColorBox>
                    {/* gray100 */}
                    <ColorBox color={colorMap[dynamicElement]}>colorMap bracket var</ColorBox>
                    <ColorBox color={colorMap[wrapperMap[secondRef]]}>colorMap bracket var</ColorBox>
                    <ColorBox color={colorMap[wrapperMap.thirdRef + wrapperMap["fourthRef"]]}>
                        colorMap bracket var
                    </ColorBox>
                    {/* gray600/gray700 */}
                    <ColorBox color={colorMap[isShown ? ("literalColor" as const) : deepReference] as any}>
                        colorMap bracket conditonal access with ref and literal wrapped with as any
                    </ColorBox>
                    {/* gray700/gray100 */}
                    <ColorBox color={(isShown ? colorMap?.[dynamicColorName] : dynamicColor) as any}>
                        conditional colorMap bracket with optional dynamic access and fallback to ref
                    </ColorBox>
                    {/* gray100 */}
                    <ColorBox color={colorMap?.staticColor}>colorMap dot optional staticColor</ColorBox>

                    {/* spread */}
                    <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
                    {/* color.blackAlpha400 */}
                    <ColorBox {...objectWithAttributes}>var spread</ColorBox>
                    {/* color.blackAlpha400 */}
                    <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
                    {/* color.facebook.200 / backgroundColor.blackAlpha.100 / borderColor.blackAlpha.300 */}
                    <ColorBox
                        {...{
                            color: "facebook.200",
                            backgroundColor: "blackAlpha.100",
                            [dynamicAttribute]: "blackAlpha.300",
                        }}
                    >
                        multiple spread
                    </ColorBox>
                    <ColorBox {...(isShown ? { color: "facebook.200" } : undefined)}>spread ternary</ColorBox>
                    <ColorBox {...(isShown && { color: "facebook.300" })}>spread &&</ColorBox>
                    {/* color.twitter.100 / backgroundColor.twitter.200 */}
                    <ColorBox {...getColorConfig()}>spread fn result</ColorBox>
                    {/* backgroundColor.twitter.200 / color.orange.100 */}
                    <ColorBox {...{ ...getColorConfig(), color: "orange.100" }}>
                        nested spread fn result and override
                    </ColorBox>
                    {/* color.orange.200 / backgroundColor.twitter.200 */}
                    <ColorBox
                        {...{
                            ...(isShown ? getColorConfig() : { color: "never.150" }),
                            color: "orange.200",
                        }}
                    >
                        nested spread conditional fn result and override
                    </ColorBox>
                    {/* backgroundColor.twitter.200 / color.orange.400 */}
                    <ColorBox
                        {...{
                            ...(!isShown ? (getColorConfig() as any) : ({ [dynamicAttribute]: "orange.300" } as any)),
                            color: "orange.400",
                        }}
                    >
                        nested spread conditional fn result and override with object literal expression and dynamic
                        attribute
                    </ColorBox>
                    <ColorBox
                        {...{
                            ...{
                                color: "telegram.100",
                                backgroundColor: "telegram.200",
                            },
                            color: "telegram.300",
                            backgroundColor: "telegram.400",
                        }}
                    >
                        spread with nested spread and override
                    </ColorBox>

                    {/* unlikely this will ever be supported (unless ezno delivers) */}
                    {/* <ColorBox color={controlledColor}>controlledColor</ColorBox>
                    <div onClick={() => setDynamicVarColor("gray.600")}>
                        <ColorBox color={dynamicVarColor}>dynamicVarColor</ColorBox>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

const ColorBox = ({ children, ...props }: PropsWithChildren<ColorSprinkes>) => {
    return <div className={colorSprinkes(props)} children={children} />;
};
