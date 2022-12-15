import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import { extract } from "../src/extractor/extract";
import type { ExtractOptions, UsedComponentsMap } from "../src/extractor/types";
import { default as ExtractSample } from "./ExtractSample?raw";

const createProject = () => {
    return new Project({
        compilerOptions: {
            jsx: ts.JsxEmit.React,
            jsxFactory: "React.createElement",
            jsxFragmentFactory: "React.Fragment",
            jsxImportSource: "react",
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
            noUnusedParameters: false,
            declaration: false,
            noEmit: true,
            emitDeclaratio: false,
            // allowJs: true,
            // useVirtualFileSystem: true,
        },
        // tsConfigFilePath: tsConfigPath,
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
        skipLoadingLibFiles: true,
    });
};

let project: Project = createProject();
let fileCount = 0;

let sourceFile: SourceFile;
afterEach(() => {
    if (!sourceFile) return;

    if (sourceFile.wasForgotten()) return;
    project.removeSourceFile(sourceFile);
});

const config: ExtractOptions["components"] = {
    ColorBox: { properties: ["color", "backgroundColor", "zIndex", "mobile"] },
};

const extractFromCode = (code: string) => {
    const usedMap = new Map() as UsedComponentsMap;
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    // console.log(sourceFile.forEachDescendant((c) => [c.getKindName(), c.getText()]));
    return extract({ ast: sourceFile, components: config, used: usedMap });
};

it("extract it all", () => {
    expect(extractFromCode(ExtractSample)).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "red.200"],
                  ["color", "yellow.300"],
                  ["backgroundColor", "blackAlpha.100"],
                  ["color", ["cyan.400", "cyan.500"]],
                  ["color", "facebook.400"],
                  ["color", "gray.100"],
                  ["color", "facebook.500"],
                  ["color", ["facebook.600", "gray.200"]],
                  ["color", ["gray.200", "gray.300"]],
                  ["color", "gray.100"],
                  ["color", "facebook.900"],
                  ["color", "facebook.900"],
                  ["color", "pink.100"],
                  ["color", "pink.100"],
                  ["color", "pink.100"],
                  ["color", "pink.100"],
                  ["color", "pink.100"],
                  ["color", "facebook.900"],
                  ["color", "facebook.900"],
                  ["color", "facebook.900"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", "gray.100"],
                  ["color", ["gray.600", "gray.800"]],
                  ["color", ["gray.700", "gray.100"]],
                  ["color", "gray.100"],
                  [
                      "color",
                      {
                          default: "red.100",
                          hover: "green.100",
                          focus: "blue.100",
                      },
                  ],
                  [
                      "backgroundColor",
                      {
                          default: "orange.800",
                          hover: "telegram.200",
                          focus: "yellow.700",
                      },
                  ],
                  ["color", "facebook.900"],
                  ["color", "facebook.900"],
                  ["color", "facebook.900"],
                  ["color", "red.100"],
                  ["color", "red.100"],
                  ["color", "green.100"],
                  ["color", "blue.100"],
                  ["color", "yellow.100"],
                  ["color", "orange.100"],
                  ["color", "orange.300"],
                  ["color", "red.100"],
                  ["color", "orange.400"],
                  ["color", "facebook.100"],
                  ["color", "blackAlpha.400"],
                  ["color", "blackAlpha.400"],
                  ["color", "facebook.200"],
                  ["backgroundColor", "blackAlpha.100"],
                  ["color", "facebook.200"],
                  ["color", "twitter.100"],
                  ["backgroundColor", "twitter.200"],
                  ["backgroundColor", "twitter.200"],
                  ["color", "orange.100"],
                  ["backgroundColor", "twitter.200"],
                  ["color", "orange.200"],
                  ["color", "orange.400"],
                  ["color", "telegram.300"],
                  ["backgroundColor", "telegram.400"],
              ],
          ],
      ]
    `);
});

it.only("extract JsxAttribute > StringLiteral (multiple)", () => {
    expect(extractFromCode(`<ColorBox color="red.200" backgroundColor="blackAlpha.100"></ColorBox>`))
        .toMatchInlineSnapshot(`
          [
              [
                  "ColorBox",
                  [
                      ["color", "red.200"],
                      ["backgroundColor", "blackAlpha.100"],
                  ],
              ],
          ]
        `);
});

it("extract JsxAttribute > JsxExpression > StringLiteral", () => {
    expect(extractFromCode(`<ColorBox color={"red.300"}></ColorBox>`)).toMatchInlineSnapshot(
        '[["ColorBox", [["color", "red.300"]]]]'
    );
});

it("extract JsxAttribute > JsxExpression > Identifier", () => {
    expect(
        extractFromCode(`
            const color = "red.400";
            <ColorBox color={color}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.400"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditonalExpression > Identifier|Value", () => {
    expect(
        extractFromCode(`
            const darkValue = "red.500";
            <ColorBox color={isDark ? darkValue : "whiteAlpha.100"}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", ["red.500", "whiteAlpha.100"]]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.600",
            } as const;
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.600"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.600",
            };
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.600"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression optional", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.700",
            } as const;
            <ColorBox color={colorMap?.["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.700"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression optional without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.700",
            };
            <ColorBox color={colorMap?.["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.700"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > Identifier", () => {
    expect(
        extractFromCode(`
            const propName = "red";
            const colorMap = {
                red: "red.800",
            } as const;
            <ColorBox color={colorMap[propName]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.800"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > Identifier without as const", () => {
    expect(
        extractFromCode(`
            const propName = "red";
            const colorMap = {
                red: "red.800",
            };
            <ColorBox color={colorMap[propName]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.800"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > StringLiteral on map with ComputedProperty name", () => {
    expect(
        extractFromCode(`
            const propName = "red";
            const colorMap = {
                [propName]: "red.900",
            } as const;
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.900"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > StringLiteral on map with ComputedProperty name without  as const", () => {
    expect(
        extractFromCode(`
            const propName = "red";
            const colorMap = {
                [propName]: "red.900",
            };
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "red.900"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ComputedProperty name", () => {
    expect(
        extractFromCode(`
            const propName = "blue";
            const colorMap = {
                [propName]: "blue.100",
            } as const;
            <ColorBox color={colorMap[propName]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.100"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ComputedProperty name without as const", () => {
    expect(
        extractFromCode(`
            const propName = "blue";
            const colorMap = {
                [propName]: "blue.100",
            };
            <ColorBox color={colorMap[propName]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.100"]]]]');
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                blue: "blue.200",
            } as const;
            <ColorBox color={colorMap.blue}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.200"]]]]');
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression optional", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                blue: "blue.300",
            } as const;
            <ColorBox color={colorMap?.blue}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.300"]]]]');
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression optional without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                blue: "blue.300",
            };
            <ColorBox color={colorMap?.blue}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.300"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.400",
            } as const;
            <ColorBox color={colorMap["long" + "Prop"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.400"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.400",
            };
            <ColorBox color={colorMap["long" + "Prop"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.400"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral + Identifier without as const", () => {
    expect(
        extractFromCode(`
            const part2 = "Prop";
            const colorMap = {
                longProp: "blue.500",
            };
            <ColorBox color={colorMap["long" + part2]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.500"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > NoSubstitionTemplateLiteral", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.600",
            } as const;
            <ColorBox color={colorMap[\`longProp\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.600"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > NoSubstitionTemplateLiteral without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.600",
            };
            <ColorBox color={colorMap[\`longProp\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.600"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral & Identifier", () => {
    expect(
        extractFromCode(`
            const part2 = "Prop" as const;
            const colorMap = {
                longProp: "blue.700",
            } as const;
            <ColorBox color={colorMap[\`long\${part2}\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.700"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral > Identifier x2", () => {
    expect(
        extractFromCode(`
            const part1 = "long" as const;
            const part2 = "Prop" as const;
            const colorMap = {
                longProp: "blue.800",
            } as const;
            <ColorBox color={colorMap[\`$\{part1}\${part2}\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.800"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditonalExpression > AsExpression (StringLiteral) + Identifier", () => {
    expect(
        extractFromCode(`
            const isDark = true;
            const lightRef = "light" as const;
            const colorMap = {
                dark: "blue.900",
                light: "blue.900",
            } as const;
            <ColorBox color={colorMap[isDark ? ("dark" as const) : lightRef]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "blue.900"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral + Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "green.100",
            } as const;
            <ColorBox color={colorMap["long" + \`\${"Prop"}\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.100"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral + TemplateStringLiteral > ElementAccessExpression > Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            const dynamic = {
                part2: "Prop",
            } as const;
            const colorMap = {
                longProp: "green.200",
            } as const;
            <ColorBox color={colorMap[("long" as any) + (\`\${dynamic["part2"]}\`) as any]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.200"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > PropertyAccessExpression + ElementAccessExpression > Identifier", () => {
    expect(
        extractFromCode(`
            const part2ref = "part2" as const;
            const dynamic = {
                part1: "long",
                part2: "Prop",
            } as const;
            const colorMap = {
                longProp: "green.300",
            } as const;
            <ColorBox color={colorMap[dynamic.part1 + dynamic[part2ref]]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.300"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            <ColorBox color={{ staticColor: "green.400" }["staticColor"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.400"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression (AsExpression) > Identifier (StringLiteral) x2", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "green.500",
            };
            <ColorBox color={colorMap["long" + "Prop"] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.500"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression (AsExpression) > Identifier (StringLiteral) x2 on ShorthandPropertyAssignment", () => {
    expect(
        extractFromCode(`
            const longProp = "green.600"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap["long" + "Prop"] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.600"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral (AsExpression) + TemplateStringLiteral > Identifier (StringLiteral) (AsExpression)", () => {
    expect(
        extractFromCode(`
            const dynamicPart2 = "Prop";
            const withDynamicPart = {
                dynamicPart2: dynamicPart2,
            };
            const longProp = "green.700"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[("long" as any) + \`\${withDynamicPart["dynamicPart2"]}\`] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.700"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ElementAccessExpression > Identifier > Identifier", () => {
    expect(
        extractFromCode(`
            const dynamicElement = "longProp";
            const secondRef = "secondLevel";
            const wrapperMap = {
                [secondRef]: dynamicElement,
            };
            const longProp = "green.800"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[wrapperMap[secondRef]]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.800"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={["green.900"][0]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "green.900"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={["pink.100"]["0"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.100"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const nbIndex = 1;
            <ColorBox color={["pink.100", "pink.200"][nbIndex]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.200"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > StringLiteral", () => {
    expect(
        extractFromCode(`
            const strIndex = "0";
            <ColorBox color={["pink.300"][strIndex]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.300"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ParenthesizedExpression > AsExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const array = ["pink.400"];
            <ColorBox color={(array as any)?.[0] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.400"]]]]');
});

it("extract JsxAttribute > JsxExpression > ArrayLiteralExpression > ElementAccessExpression > NonNullExpression > ElementAccessExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const array = ["pink.500"];
            <ColorBox color={[array[0]]![0]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.500"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ElementAccessExpression > ArrayLiteralExpression > ObjectLiteralExpresssion > PropertyAssignment > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={[{ staticColor: "pink.600" }][0]["staticColor"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.600"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "pink.700",
                [deepReference]: "pink.800",
            };

            <ColorBox color={colorMap[!isShown ? ("literalColor" as const) : deepReference] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.800"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateExpression > Identifier > TemplateExpression", () => {
    expect(
        extractFromCode(`
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\` as const;

            const longProp = "pink.900"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[\`\${dynamicPartsAsTemplateString}\`] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.900"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateExpression > Identifier > TemplateExpression without as const", () => {
    expect(
        extractFromCode(`
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\`;

            const longProp = "pink.900"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[\`\${dynamicPartsAsTemplateString}\`] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "pink.900"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > PropertyAccessExpression + ElementAccessExpression", () => {
    expect(
        extractFromCode(`
            const dynamicElement = "longProp";
            const secondRef = "secondLevel";

            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const withDynamicPart = {
                dynamicPart1,
                dynamicPart2: dynamicPart2,
            };

            const wrapperMap = {
                [secondRef]: dynamicElement,
                thirdRef: withDynamicPart.dynamicPart1,
                fourthRef: withDynamicPart["dynamicPart2"],
            };
            const longProp = "yellow.100"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[wrapperMap.thirdRef + wrapperMap["fourthRef"]]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "yellow.100"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression evaluate (first when true is right)", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "yellow.200",
                [deepReference]: "yellow.300",
                refToAnother: "another",
                another: "yellow.400",
            };

            <ColorBox color={colorMap[isShown ? ("literalColor" as const) : (false ? "yellow.never" : 1 === 1 ? colorMap["refToAnother"] : deepReference)] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "yellow.200"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression evaluate (second when true is right)", () => {
    expect(
        extractFromCode(`
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "yellow.200",
                [deepReference]: "yellow.300",
                refToAnother: "another",
                another: "yellow.500",
            };

            <ColorBox color={colorMap[(false ? "yellow.never" : 1 === 1 ? colorMap["refToAnother"] : deepReference)] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "yellow.500"]]]]');
});

it("extract JsxAttribute > JsxExpression > CallExpression > ArrowFunction > Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            const getColor = () => "yellow.600";

            <ColorBox color={getColor()}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "yellow.600"]]]]');
});

it("extract JsxAttribute > JsxExpression > CallExpression > FunctionDeclaration > Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            function getColor() {
                return "yellow.700";
            }

            <ColorBox color={getColor()}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "yellow.700"]]]]');
});

it("extract JsxAttribute > JsxExpression > CallExpression with Parameter > ElementAccessExpression > ArrayLiteralExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            const pickSecondElement = (arr: string[]) => arr[1];
            const array = ["yellow.800", "yellow.900"];

            <ColorBox color={pickSecondElement(array)}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "yellow.900"]]]]');
});

it("extract JsxAttribute > JsxExpression > CallExpression with non-deterministic results > should returns nothing", () => {
    expect(
        extractFromCode(`
            const pickRandom = <T = any>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
            const array = ["purple.never1", "purple.alsoNever"];

            <ColorBox color={pickRandom(array)}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", null]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > BinaryExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={(1 + 1) === 2 ? "purple.100" : "purple.never2"}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "purple.100"]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ConditionalExpression > ParenthesizedExpression > BinaryExpression", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                literalColor: "purple.200",
            };
            <ColorBox color={colorMap[(1 + 1) !== 2 ? "never" : "literalColor"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "purple.200"]]]]');
});

it("extract JsxAttribute > JsxExpression > CallExpression > ElementAccessExpression > ArrowFunction > ElementAccessExpression > ArrayLiteralExpression > Identifier > CallExpression > ConditionalExpression > BinaryExpression", () => {
    expect(
        extractFromCode(`
            const array = ["never1", "literalColor"]
            const getter = () => array[1];
            const colorMap = {
                literalColor: () => (1 + 1) === 3 ? "never2" : "purple.300",
            };
            <ColorBox color={colorMap[getter()]()}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "purple.300"]]]]');
});

it("extract JsxAttribute > JsxExpression > BinaryExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            const dot = ".";
            <ColorBox color={"purple" + dot + "400"}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "purple.400"]]]]');
});

it("extract JsxAttribute > JsxExpression > resolvable ConditionalExpression result", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const dynamicElement = "staticColor";
            const staticColor = "never.100" as const;

            const colorMap = {
                staticColor,
                [dynamicColorName]: "purple.500",
            };
            const dynamicColor = colorMap[dynamicElement];

            <ColorBox color={(isShown ? colorMap?.[dynamicColorName] : dynamicColor) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "purple.500"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression with Unexpected Node: 'BindingElement' cause of useState should fallback to both possible outcome", () => {
    expect(
        extractFromCode(`
            const [isShown] = useState(true);
            const dynamicColorName = "something";
            const dynamicElement = "staticColor";
            const staticColor = "purple.700" as const;

            const colorMap = {
                staticColor,
                [dynamicColorName]: "purple.600",
            };
            const dynamicColor = colorMap[dynamicElement];

            <ColorBox color={(isShown ? colorMap?.[dynamicColorName] : dynamicColor) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", ["purple.600", "purple.700"]]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > unresolvable expression will output both outcome ", () => {
    expect(
        extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            <ColorBox color={(!knownCondition ? "purple.800" : unresolvableBoolean ? "purple.900" : "purple.950")}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", ["purple.800", "purple.900", "purple.950"]]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > ElementAccessExpression > nested unresolvable expression will output both outcome ", () => {
    expect(
        extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            const colorMap = {
                staticColor: "orange.200",
                another: "orange.300",
            };

            <ColorBox color={(!knownCondition ? "orange.100" : colorMap[unresolvableBoolean ? "staticColor" : "another"])}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", ["orange.100", "orange.200", "orange.300"]]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > ElementAccessExpression > with nested unresolvable expression will stop at first resolved truthy condition", () => {
    expect(
        extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownTruthy = true;

            const colorMap = {
                staticColor: "never.200",
                another: "never.300",
            };

            <ColorBox color={(knownTruthy ? "orange.400" : colorMap[unresolvableBoolean ? "staticColor" : "another"])}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "orange.400"]]]]');
});

it("extract JsxAttribute > JsxExpression > multiple variables with same name but different scope", () => {
    expect(
        extractFromCode(`
            const color = "never.500";

            const Wrapper = () => {
                const color = "orange.500";
                return <ColorBox color={color}></ColorBox>
            }

        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "orange.500"]]]]');
});

it("extract JsxAttribute > JsxExpression > variables referencing another var in above scope", () => {
    expect(
        extractFromCode(`
            const referenced = "orange.600";

            const Wrapper = () => {
                const color = referenced;
                return <ColorBox color={color}></ColorBox>
            }

        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "orange.600"]]]]');
});

it("extract JsxSpreadAttribute > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            <ColorBox {...{ color: "orange.700" }}>spread</ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "orange.700"]]]]');
});

it("extract JsxSpreadAttribute > Identifier > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "orange.800" } as any;
            <ColorBox {...objectWithAttributes}>var spread</ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "orange.800"]]]]');
});

it("extract JsxSpreadAttribute > ConditionalExpression > Identifier/NullKeyword > falsy", () => {
    expect(
        extractFromCode(`
            const isShown = false;
            const objectWithAttributes = { color: "never.400" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", []]]');
});

it("extract JsxSpreadAttribute > ConditionalExpression > Identifier/NullKeyword > truthy", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const objectWithAttributes = { color: "orange.900" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "orange.900"]]]]');
});

it("extract JsxSpreadAttribute > PropertyAssignment / ComputedProperty", () => {
    expect(
        extractFromCode(`
            const dynamicThemeProp = "backgroundColor";
            const dynamicAttribute = "notThemeProp";
            <ColorBox
                {...{
                    color: "teal.100",
                    [dynamicThemeProp]: "teal.200",
                    [dynamicAttribute]: "teal.300",
                }}
            >
                multiple spread
            </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "teal.100"],
                  ["backgroundColor", "teal.200"],
              ],
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ConditionalExpression > ObjectLiteralExpression/Identifier", () => {
    expect(
        extractFromCode(`
            <ColorBox {...(true ? ({ color: "teal.400" }) as any : (undefined) as unknown)}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "teal.400"]]]]');
});

it("extract JsxSpreadAttribute > BinaryExpression > AmpersandAmpersandToken / ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            <ColorBox {...(true && ({ color: "teal.500" }))}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "teal.500"]]]]');
});

it("extract JsxSpreadAttribute > CallExpression", () => {
    expect(
        extractFromCode(`
            const getColorConfig = () => ({ color: "teal.600", backgroundColor: "teal.650" });
            <ColorBox {...getColorConfig()}>spread fn result</ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "teal.600"],
                  ["backgroundColor", "teal.650"],
              ],
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ObjectLiteralExpression > SpreadAssignment > CallExpression", () => {
    expect(
        extractFromCode(`
            const getColorConfig = () => ({ color: "never.700", backgroundColor: "teal.800" });
            <ColorBox {...{ ...getColorConfig(), color: "teal.700" }}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "teal.800"],
                  ["color", "teal.700"],
              ],
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ObjectLiteralExpression > SpreadAssignment > ConditionalExpression > CallExpression", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const getColorConfig = () => ({ color: "teal.900", backgroundColor: "cyan.100" });
            <ColorBox
                {...{
                    ...(isShown ? (getColorConfig() as any) : { color: "never.150" }),
                    color: "cyan.200",
                }}
            >
                nested spread conditional fn result and override
            </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "cyan.100"],
                  ["color", "cyan.200"],
              ],
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > BinaryExpression > AmpersandAmpersandToken / ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const getColorConfig = () => ({ color: "never.300", backgroundColor: "never.400" });
            const dynamicAttribute = "background" + "Color";
            <ColorBox
                {...{
                    ...(!isShown ? (getColorConfig() as any) : ({ [dynamicAttribute]: "cyan.300" } as any)),
                    color: "cyan.400",
                }}
            >
                nested spread conditional fn result and override with object literal expression and dynamic
                attribute
            </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "cyan.300"],
                  ["color", "cyan.400"],
              ],
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > 3 depth spread", () => {
    expect(
        extractFromCode(`
            const getColorConfig = () => ({ color: "cyan.500", backgroundColor: "never.600" });
            <ColorBox
                {...{
                    ...{
                        ...getColorConfig(),
                        backgroundColor: "never.700",
                    },
                    backgroundColor: "cyan.600",
                }}
            >
                spread with nested spread with nested spread and override
            </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "cyan.500"],
                  ["backgroundColor", "cyan.600"],
              ],
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ConditionalExpression > unresolvable expression with Unexpected Node: 'BindingElement' cause of useState should fallback to both possible outcome ", () => {
    expect(
        extractFromCode(`
            const [isShown] = useState(true);
            const objectWithAttributes = { color: "cyan.700" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : { backgroundColor: "cyan.800" })}>conditional var spread</ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "cyan.700"],
                  ["backgroundColor", "cyan.800"],
              ],
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ElementAccessExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "cyan.900" } as any;
            const themeObjectsMap = {
                basic: objectWithAttributes,
            };
            <ColorBox {...themeObjectsMap[\`basic\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "cyan.900"]]]]');
});

it("extract JsxSpreadAttribute > PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.100" } as any;
            const themeObjectsMap = {
                basic: objectWithAttributes,
            };
            <ColorBox {...themeObjectsMap.basic}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "salmon.100"]]]]');
});

it("extract JsxSpreadAttribute > PropertyAccessExpression > nested", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.200" } as any;
            const themeObjectsMap = {
                basic: {
                    nested: objectWithAttributes
                },
            };
            <ColorBox {...themeObjectsMap.basic.nested}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "salmon.200"]]]]');
});

it("extract JsxSpreadAttribute > ElementAccessExpression + PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.300" } as any;
            const themeObjectsMap = {
                basic: { nested: objectWithAttributes },
            };
            <ColorBox {...themeObjectsMap[\`basic\`].nested}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "salmon.300"]]]]');
});

it("extract JsxSpreadAttribute > ElementAccessExpression > nested", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.400" } as any;
            const themeObjectsMap = {
                basic: { nested: objectWithAttributes },
            };
            <ColorBox {...themeObjectsMap[\`basic\`]["nested"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "salmon.400"]]]]');
});

it("extract JsxSpreadAttribute > ElementAccessExpression > Identifier / ComputedProperty", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.500" } as any;
            const dynamicAttribute = "basic";
            const themeObjectsMap = {
                [dynamicAttribute]: objectWithAttributes
            };
            <ColorBox {...themeObjectsMap[dynamicAttribute]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "salmon.500"]]]]');
});

it("extract JsxSpreadAttribute > ElementAccessExpression > ComputedProperty / TemplateStringLiteral", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.600" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\`;

            const themeObjectsMap = {
                longProp: objectWithAttributes
            };
            <ColorBox {...(themeObjectsMap[\`\${dynamicPartsAsTemplateString}\`]) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "salmon.600"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > complex nested condition > truthy", () => {
    expect(
        extractFromCode(`
            const knownCondition = true;

            const objectWithAttributes = { color: "salmon.700" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "never.500" },
            };
            const getBasic = () => (themeObjectsMap as any)?.basic!;
            const getMap = { getter: getBasic };
            const assertMap = { isTrue: () => !!Boolean(true) && 1 };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : assertMap.isTrue() ? getMap.getter() : themeObjectsMap[dynamicPart1 + dynamicPart2] )}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "salmon.700"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > complex nested condition > truthy", () => {
    expect(
        extractFromCode(`
            const knownCondition = true;

            const objectWithAttributes = { color: "never.700" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "salmon.800" },
            };
            const getBasic = () => (themeObjectsMap as any)?.basic!;
            const getMap = { getter: getBasic };
            const assertMap = { isFalse: () => false };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : assertMap.isFalse() ? getMap.getter() : themeObjectsMap[dynamicPart1 + dynamicPart2] )}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "salmon.800"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > unresolvable expression will output both outcome ", () => {
    expect(
        extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            const objectWithAttributes = { color: "salmon.850" } as any;

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "salmon.900" },
            };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : unresolvableBoolean ? themeObjectsMap.basic : themeObjectsMap.longProp )}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "never.250"],
                  ["color", "salmon.850"],
                  ["color", "salmon.900"],
              ],
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ElementAccessExpression > CallExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "white.100" } as any;
            const getDynamicAttribute = () => "basic";
            const themeObjectsMap = {
                basic: objectWithAttributes
            };
            <ColorBox {...themeObjectsMap[getDynamicAttribute()]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "white.100"]]]]');
});

it("extract JsxAttribute > ElementAccessExpression > CallExpression > PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "white.200" } as any;
            const getDynamicAttribute = () => "basic";
            const themeObjectsMap = {
                basic: objectWithAttributes
            };
            <ColorBox color={themeObjectsMap[getDynamicAttribute()].color}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "white.200"]]]]');
});

it("extract JsxAttribute > JsxExpression  > NumericLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox zIndex={1}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["zIndex", "1"]]]]');
});

it("extract JsxAttribute > JsxExpression > Identifier > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const nbIndex = 2;
            <ColorBox zIndex={nbIndex}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["zIndex", "2"]]]]');
});

it("extract JsxAttribute > JsxExpression > Identifier > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const nbIndex = 1;
            const isShown = true;
            <ColorBox zIndex={isShown ? 3 : 0}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["zIndex", 3]]]]');
});

it("extract JsxAttribute > JsxExpression > CallExpression > immediately invoked > NumericLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox zIndex={(() => 4)()}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["zIndex", 4]]]]');
});

it("extract JsxAttribute > JsxExpression > CallExpression > optional + NonNullable + AsExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const getMap = { get: () => 5 };
            <ColorBox zIndex={(getMap?.get()!) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["zIndex", 5]]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const map = { thing: 6 };
            <ColorBox zIndex={map["thing"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["zIndex", "6"]]]]');
});

it("extract JsxAttribute > JsxExpression > ObjectLiteralExpression > conditional sprinkles", () => {
    expect(
        extractFromCode(`
            <ColorBox color={{ mobile: "white.300", tablet: "white.400", desktop: "white.500" }}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.300",
                          tablet: "white.400",
                          desktop: "white.500",
                      },
                  ],
              ],
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            const map = {
                responsiveColor: {
                    mobile: "white.600",
                    tablet: "white.700",
                    desktop: "white.800",
                }
            };

            <ColorBox color={(map?.responsiveColor) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.600",
                          tablet: "white.700",
                          desktop: "white.800",
                      },
                  ],
              ],
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            const map = {
                responsiveColor: () => ({
                    mobile: "white.600",
                    tablet: "white.700",
                    desktop: "white.800",
                })
            };

            <ColorBox color={map["responsiveColor"]!()}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.600",
                          tablet: "white.700",
                          desktop: "white.800",
                      },
                  ],
              ],
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression + AsExpression + QuestionMarkToken + TemplateExpression + BinaryExpression + CallExpression", () => {
    expect(
        extractFromCode(`
            const colorRef = "Color";
            const dynamic = "responsiveColor";
            const responsiveColor = ({
                mobile: "black.100",
                tablet: "black.200",
                desktop: "black.300",
            });

            const map = {
                [dynamic]: () => responsiveColor
            };

            <ColorBox color={((map as any)?.[\`responsive\` + \`\${colorRef}\`] as any)()}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "black.100",
                          tablet: "black.200",
                          desktop: "black.300",
                      },
                  ],
              ],
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > truthy", () => {
    expect(
        extractFromCode(`
            <ColorBox color={true ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "black.400",
                          tablet: "black.500",
                          desktop: "black.600",
                      },
                  ],
              ],
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > falsy", () => {
    expect(
        extractFromCode(`
            <ColorBox color={false ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [["color", "black.700"]]]]');
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > unresolvable condition", () => {
    expect(
        extractFromCode(`
            const [isShown] = useState(true);
            <ColorBox color={isShown ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `)
    ).toMatchInlineSnapshot(
        `
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      [
                          {
                              mobile: "black.400",
                              tablet: "black.500",
                              desktop: "black.600",
                          },
                          "black.700",
                      ],
                  ],
              ],
          ],
      ]
    `
    );
});

it("extract JsxAttribute > JsxExpression > reversed", () => {
    expect(
        extractFromCode(`
            <ColorBox mobile={{ color: "sky.100", tablet: "sky.200", desktop: "sky.300" }} />
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "mobile",
                      {
                          color: "sky.100",
                          tablet: "sky.200",
                          desktop: "sky.300",
                      },
                  ],
              ],
          ],
      ]
    `);
});

// TODO valueOrNullable ?? fallback
// TODO valueOrNullable ?? fallback ?? fallback
// TODO valueOrFalsy ?? fallback
