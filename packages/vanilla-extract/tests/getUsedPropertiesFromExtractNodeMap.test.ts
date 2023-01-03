import type { ExtractOptions, BoxNodesMap } from "@box-extractor/core";
import { Project, SourceFile, ts } from "ts-morph";

import { extract } from "@box-extractor/core";
import { afterEach, expect, it } from "vitest";
import {
    getUsedPropertiesFromExtractNodeMap,
    UsedComponentMap,
} from "../src/plugins/getUsedPropertiesFromExtractNodeMap";

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

const config: ExtractOptions["components"] = { TestBox: { properties: "all" } };

const extractFromCode = (code: string) => {
    const extractMap = new Map() as BoxNodesMap;
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    // console.log(sourceFile.forEachDescendant((c) => [c.getKindName(), c.getText()]));
    // return extract({ ast: sourceFile, components: config, used: usedMap });
    const extracted = extract({ ast: sourceFile, components: config, used: extractMap });
    // console.dir({ test: true, usedMap, extracted }, { depth: null });
    const usedComponents = new Map() as UsedComponentMap;
    return getUsedPropertiesFromExtractNodeMap(extracted, usedComponents);
};

const BoxDemoStr = `export function BoxDemo() {
    const [isShown, setIsShown] = React.useState(false);
    const knownCondition = true;

    return (
        <TestBox backgroundColor="gray.200" p="4" borderRadius="2xl">
            <TestBox color="green.500">green.500</TestBox>
            <TestBox color="orange.400">orange.400</TestBox>
            <div className={colorMode.light}>
                <TestBox color="main">lightmode using theme+var</TestBox>
            </div>
            <div className={colorMode.dark}>
                <TestBox color="main">darkmode using theme+var</TestBox>
            </div>

            <TestBox color={{ hover: "green.100" }}>condition.hover green.100</TestBox>
            <TestBox __color="#5f9ea0">escape hatch cadetblue #5f9ea0</TestBox>
            <TestBox _hover={{ cursor: "pointer" }}>_hover cursor.pointer</TestBox>
            <TestBox color={{ default: "blue.200", hover: "green.400" }} _hover={{ color: "red.300" }}>
                _hover cursor.pointer with default from basic condition object
            </TestBox>
            <TestBox color="pink.300" _hover={{ color: "yellow.400" }}>
                _hover cursor.pointer with default from prop string
            </TestBox>
            <TestBox color={{ desktop: "red.400", tablet: "green.400", mobile: "blue.300" }}>color/responsive rgb</TestBox>
            <TestBox color={isShown ? { desktop: "red.400", tablet: "green.400", mobile: "blue.300" } : { desktop: "red.500" }}>color/responsive rgb</TestBox>
            <TestBox color={knownCondition ? { mobile: "pink.100" } : { mobile: "never.200" }}>color/responsive rgb</TestBox>
            <TestBox color={!isShown ? { mobile: "pink.200" } : "pink.300"}>color/responsive rgb</TestBox>
        </TestBox>
    );
}`;

it("maps from BoxNodesMap to VE's used properties", () => {
    expect(extractFromCode(BoxDemoStr)).toMatchInlineSnapshot(`
      {
          usedComponents: {
              TestBox: {
                  properties: {
                      backgroundColor: ["gray.200"],
                      p: ["4"],
                      borderRadius: ["2xl"],
                      color: ["green.500", "orange.400", "main", "pink.300"],
                      __color: ["#5f9ea0"],
                  },
                  conditionalProperties: {
                      color: {
                          hover: ["green.100", "green.400"],
                          default: ["blue.200"],
                          desktop: ["red.400", "red.500"],
                          tablet: ["green.400"],
                          mobile: ["blue.300", "pink.100", "pink.200"],
                      },
                      _hover: {
                          cursor: ["pointer"],
                          color: ["red.300", "yellow.400"],
                      },
                  },
              },
          },
          usedDebugIdList: [
              "TestBox_backgroundColor_gray.200",
              "TestBox_p_4",
              "TestBox_borderRadius_2xl",
              "TestBox_color_green.500",
              "TestBox_color_orange.400",
              "TestBox_color_main",
              "TestBox_color_hover_green.100",
              "TestBox_color_default_blue.200",
              "TestBox_color_hover_green.400",
              "TestBox_color_pink.300",
              "TestBox_color_desktop_red.400",
              "TestBox_color_tablet_green.400",
              "TestBox_color_mobile_blue.300",
              "TestBox_color_desktop_red.500",
              "TestBox_color_mobile_pink.100",
              "TestBox_color_mobile_pink.200",
              "TestBox___color_#5f9ea0",
              "TestBox_cursor__hover_pointer",
              "TestBox_color__hover_red.300",
              "TestBox_color__hover_yellow.400",
          ],
      }
    `);
});

it("merges existing used properties with new extract results", () => {});
