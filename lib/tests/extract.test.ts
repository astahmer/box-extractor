import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import { extract } from "../src/extract";
import { default as ExtractSample } from "./ExtractSample?raw";

const createProject = () => {
    return new Project({
        compilerOptions: {
            jsx: ts.JsxEmit.React,
            jsxFactory: "React.createElement",
            jsxFragmentFactory: "React.Fragment",
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

const componentName = "ColorBox";
const propNameList = ["color", "backgroundColor"];

const extractFromCode = (code: string) => {
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    // console.log(sourceFile.forEachDescendant((c) => [c.getKindName(), c.getText()]));
    return extract(sourceFile, { componentName, propNameList });
};

it("extract it all", () => {
    const sourceFile = project.createSourceFile("ExtractSample.tsx", ExtractSample);

    expect(extract(sourceFile, { componentName, propNameList })).toMatchInlineSnapshot(`
      [
          ["color", "red.200"],
          ["color", "yellow.300"],
          ["backgroundColor", "blackAlpha.100"],
          ["color", ["cyan.400", "cyan.500"]],
          ["color", "facebook.400"],
          ["color", "gray.100"],
          ["color", ["facebook.500", "gray.300"]],
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
          ["color", ["gray.600", "gray.700"]],
          ["color", ["gray.700", "gray.100"]],
          ["color", "gray.100"],
      ]
    `);

    project.removeSourceFile(sourceFile);
});

it("extract JsxAttribute > StringLiteral (multiple)", () => {
    expect(extractFromCode(`<ColorBox color="red.200" backgroundColor="blackAlpha.100"></ColorBox>`))
        .toMatchInlineSnapshot(`
      [
          ["color", "red.200"],
          ["backgroundColor", "blackAlpha.100"],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > StringLiteral", () => {
    expect(extractFromCode(`<ColorBox color={"red.300"}></ColorBox>`)).toMatchInlineSnapshot('[["color", "red.300"]]');
});

it("extract JsxAttribute > JsxExpression > Identifier", () => {
    expect(
        extractFromCode(`
            const color = "red.400";
            <ColorBox color={color}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "red.400"]]');
});

it("extract JsxAttribute > JsxExpression > ConditonalExpression > Identifier|Value", () => {
    expect(
        extractFromCode(`
            const darkValue = "red.500";
            <ColorBox color={isDark ? darkValue : "whiteAlpha.100"}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", ["red.500", "whiteAlpha.100"]]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.600",
            } as const;
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "red.600"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression optional", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.700",
            } as const;
            <ColorBox color={colorMap?.["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "red.700"]]');
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
    ).toMatchInlineSnapshot('[["color", "red.800"]]');
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
    ).toMatchInlineSnapshot('[["color", "red.900"]]');
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
    ).toMatchInlineSnapshot('[["color", "blue.100"]]');
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                blue: "blue.200",
            } as const;
            <ColorBox color={colorMap.blue}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "blue.200"]]');
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression optional", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                blue: "blue.300",
            } as const;
            <ColorBox color={colorMap?.blue}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "blue.300"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.400",
            } as const;
            <ColorBox color={colorMap["long" + "Prop"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "blue.400"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral + Identifier", () => {
    expect(
        extractFromCode(`
            const part2 = "Prop" as const;
            const colorMap = {
                longProp: "blue.500",
            } as const;
            <ColorBox color={colorMap["long" + part2]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "blue.500"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.600",
            } as const;
            <ColorBox color={colorMap[\`longProp\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "blue.600"]]');
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
    ).toMatchInlineSnapshot('[["color", "blue.700"]]');
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
    ).toMatchInlineSnapshot('[["color", "blue.800"]]');
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
    ).toMatchInlineSnapshot('[["color", "blue.900"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral + Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "green.100",
            } as const;
            <ColorBox color={colorMap["long" + \`\${"Prop"}\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "green.100"]]');
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
    ).toMatchInlineSnapshot('[["color", "green.200"]]');
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
    ).toMatchInlineSnapshot('[["color", "green.300"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            <ColorBox color={{ staticColor: "green.400" }["staticColor"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "green.400"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression (AsExpression) > Identifier (StringLiteral) x2", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "green.500",
            };
            <ColorBox color={colorMap["long" + "Prop"] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "green.500"]]');
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
    ).toMatchInlineSnapshot('[["color", "green.600"]]');
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
    ).toMatchInlineSnapshot('[["color", "green.700"]]');
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
    ).toMatchInlineSnapshot('[["color", "green.800"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={["green.900"][0]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "green.900"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={["pink.100"]["0"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "pink.100"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const nbIndex = 1;
            <ColorBox color={["pink.100", "pink.200"][nbIndex]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "pink.200"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > StringLiteral", () => {
    expect(
        extractFromCode(`
            const strIndex = "0";
            <ColorBox color={["pink.300"][strIndex]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "pink.300"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ParenthesizedExpression > AsExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const array = ["pink.400"];
            <ColorBox color={(array as any)?.[0] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "pink.400"]]');
});

it("extract JsxAttribute > JsxExpression > ArrayLiteralExpression > ElementAccessExpression > NonNullExpression > ElementAccessExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const array = ["pink.500"];
            <ColorBox color={[array[0]]![0]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "pink.500"]]');
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ElementAccessExpression > ArrayLiteralExpression > ObjectLiteralExpresssion > PropertyAssignment > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={[{ staticColor: "pink.600" }][0]["staticColor"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", "pink.600"]]');
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

            <ColorBox color={colorMap[isShown ? ("literalColor" as const) : deepReference] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot('[["color", ["pink.700", "pink.800"]]]');
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
    ).toMatchInlineSnapshot('[["color", "pink.900"]]');
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
    ).toMatchInlineSnapshot('[["color", "yellow.100"]]');
});

// TODO sans `as const`
// TODO condtions ternaires imbriquées
// TODO conditions check si truthy ?
