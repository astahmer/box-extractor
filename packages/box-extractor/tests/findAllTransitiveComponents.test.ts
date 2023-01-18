import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import {
    findAllTransitiveComponents,
    FindAllTransitiveComponentsOptions,
} from "../src/extractor/findAllTransitiveComponents";
// @ts-ignore
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

const findInCode = (code: string, options: Omit<FindAllTransitiveComponentsOptions, "ast" | "transitiveMap">) => {
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    // console.log(sourceFile.forEachDescendant((c) => [c.getKindName(), c.getText()]));
    const transitiveMap: FindAllTransitiveComponentsOptions["transitiveMap"] = new Map();
    const names = findAllTransitiveComponents({ ast: sourceFile, transitiveMap, ...options });
    // console.log({ names });
    return { transitiveMap, names };
};

it("findAllTransitiveComponents", () => {
    expect(findInCode(ExtractSample, { components: ["ColorBox"] })).toMatchInlineSnapshot(`
      {
          transitiveMap: {
              ColorBox: {
                  from: null,
                  referencedBy: [
                      "Demo",
                      "Wrapper",
                      "Another",
                      "ArrowSomething",
                      "ArrowWithBlockSomething",
                      "FunctionExpressionSomething",
                      "AnonymousFunctionExpression",
                      "RefSomething",
                      "LiteralRef",
                      "ComputedLiteralRef",
                      "ObjectBindingSomething",
                      "RandomName",
                  ],
                  refUsedWithSpread: [
                      "Demo",
                      "Wrapper",
                      "Another",
                      "ArrowSomething",
                      "ArrowWithBlockSomething",
                      "FunctionExpressionSomething",
                      "AnonymousFunctionExpression",
                      "RefSomething",
                      "LiteralRef",
                      "ComputedLiteralRef",
                      "ObjectBindingSomething",
                      "RandomName",
                  ],
              },
              Demo: {
                  from: "ColorBox",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              Wrapper: {
                  from: "ColorBox",
                  referencedBy: ["UsingWrapperWithSpread"],
                  refUsedWithSpread: ["UsingWrapperWithSpread"],
              },
              Another: {
                  from: "ColorBox",
                  referencedBy: ["UsingAnotherWithSpread"],
                  refUsedWithSpread: ["UsingAnotherWithSpread"],
              },
              ArrowSomething: {
                  from: "ColorBox",
                  referencedBy: ["UsingArrowSomethingWithSpread"],
                  refUsedWithSpread: ["UsingArrowSomethingWithSpread"],
              },
              ArrowWithBlockSomething: {
                  from: "ColorBox",
                  referencedBy: ["UsingArrowWithBlockSomethingWithSpread"],
                  refUsedWithSpread: ["UsingArrowWithBlockSomethingWithSpread"],
              },
              FunctionExpressionSomething: {
                  from: "ColorBox",
                  referencedBy: ["UsingFunctionExpressionSomethingWithSpread"],
                  refUsedWithSpread: ["UsingFunctionExpressionSomethingWithSpread"],
              },
              AnonymousFunctionExpression: {
                  from: "ColorBox",
                  referencedBy: ["UsingAnonymousFunctionExpressionWithSpread"],
                  refUsedWithSpread: ["UsingAnonymousFunctionExpressionWithSpread"],
              },
              RefSomething: {
                  from: "ColorBox",
                  referencedBy: ["UsingRefWithSpread"],
                  refUsedWithSpread: ["UsingRefWithSpread"],
              },
              LiteralRef: {
                  from: "ColorBox",
                  referencedBy: ["UsingLiteralRefWithSpread"],
                  refUsedWithSpread: ["UsingLiteralRefWithSpread"],
              },
              ComputedLiteralRef: {
                  from: "ColorBox",
                  referencedBy: ["UsingComputedLiteralRefWithSpread"],
                  refUsedWithSpread: ["UsingComputedLiteralRefWithSpread"],
              },
              ObjectBindingSomething: {
                  from: "ColorBox",
                  referencedBy: ["UsingObjectBindingSomethingWithSpread"],
                  refUsedWithSpread: ["UsingObjectBindingSomethingWithSpread"],
              },
              RandomName: {
                  from: "ColorBox",
                  referencedBy: ["UsingRandomNameWithSpread"],
                  refUsedWithSpread: ["UsingRandomNameWithSpread"],
              },
              UsingWrapperWithSpread: {
                  from: "Wrapper",
                  referencedBy: ["LevelThreeComponent"],
                  refUsedWithSpread: ["LevelThreeComponent"],
              },
              UsingAnotherWithSpread: {
                  from: "Another",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              UsingArrowSomethingWithSpread: {
                  from: "ArrowSomething",
                  referencedBy: ["LevelThreeUsingArrowSomethingWithSpread"],
                  refUsedWithSpread: ["LevelThreeUsingArrowSomethingWithSpread"],
              },
              UsingArrowWithBlockSomethingWithSpread: {
                  from: "ArrowWithBlockSomething",
                  referencedBy: ["LevelThreeUsingArrowWithBlockSomethingWithSpread"],
                  refUsedWithSpread: ["LevelThreeUsingArrowWithBlockSomethingWithSpread"],
              },
              UsingFunctionExpressionSomethingWithSpread: {
                  from: "FunctionExpressionSomething",
                  referencedBy: ["LevelThreeUsingFunctionExpressionSomethingWithSpread"],
                  refUsedWithSpread: ["LevelThreeUsingFunctionExpressionSomethingWithSpread"],
              },
              UsingAnonymousFunctionExpressionWithSpread: {
                  from: "AnonymousFunctionExpression",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              UsingRefWithSpread: {
                  from: "RefSomething",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              UsingLiteralRefWithSpread: {
                  from: "LiteralRef",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              UsingComputedLiteralRefWithSpread: {
                  from: "ComputedLiteralRef",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              UsingObjectBindingSomethingWithSpread: {
                  from: "ObjectBindingSomething",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              UsingRandomNameWithSpread: {
                  from: "RandomName",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              LevelThreeComponent: {
                  from: "UsingWrapperWithSpread",
                  referencedBy: ["LevelFourComponentWithSpread"],
                  refUsedWithSpread: ["LevelFourComponentWithSpread"],
              },
              LevelThreeUsingArrowSomethingWithSpread: {
                  from: "UsingArrowSomethingWithSpread",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              LevelThreeUsingArrowWithBlockSomethingWithSpread: {
                  from: "UsingArrowWithBlockSomethingWithSpread",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              LevelThreeUsingFunctionExpressionSomethingWithSpread: {
                  from: "UsingFunctionExpressionSomethingWithSpread",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              LevelFourComponentWithSpread: {
                  from: "LevelThreeComponent",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
          },
          names: [
              "Demo",
              "Wrapper",
              "Another",
              "ArrowSomething",
              "ArrowWithBlockSomething",
              "FunctionExpressionSomething",
              "AnonymousFunctionExpression",
              "RefSomething",
              "LiteralRef",
              "ComputedLiteralRef",
              "ObjectBindingSomething",
              "RandomName",
              "UsingWrapperWithSpread",
              "UsingAnotherWithSpread",
              "UsingArrowSomethingWithSpread",
              "UsingArrowWithBlockSomethingWithSpread",
              "UsingFunctionExpressionSomethingWithSpread",
              "UsingAnonymousFunctionExpressionWithSpread",
              "UsingRefWithSpread",
              "UsingLiteralRefWithSpread",
              "UsingComputedLiteralRefWithSpread",
              "UsingObjectBindingSomethingWithSpread",
              "UsingRandomNameWithSpread",
              "LevelThreeComponent",
              "LevelThreeUsingArrowSomethingWithSpread",
              "LevelThreeUsingArrowWithBlockSomethingWithSpread",
              "LevelThreeUsingFunctionExpressionSomethingWithSpread",
              "LevelFourComponentWithSpread",
          ],
      }
    `);
});

it("real-world usage", () => {
    expect(
        findInCode(
            `
        import { Children, PropsWithChildren, ReactNode } from "react";
        import type { BoxProps, PolymorphicComponentProps } from "./Box";
        import { Box } from "./Box";

        type StackProps = Omit<BoxProps, "align"> & {
            children: ReactNode;
            spacing?: BoxProps["paddingBottom"];
        };
        const defaultElement = "div";

        // https://github.com/vanilla-extract-css/vanilla-extract/blob/98f8b0387d661b77705d2cd83ab3095434e1223e/site/src/system/Stack/Stack.tsx#L32
        export const Stack = <TType extends React.ElementType = typeof defaultElement>(
            props: PolymorphicComponentProps<StackProps, TType>
        ) => {
            const { children, as, spacing, ...rest } = props;
            const stackItems = Children.toArray(children);
            const direction = props.flexDirection ?? "column";

            return (
                <Box display="flex" flexDirection={direction} {...rest}>
                    {stackItems.map((item, index) => (
                        <Box
                            key={index}
                            pr={direction === "row" ? (index !== stackItems.length - 1 ? spacing ?? "0" : "0") : "0"}
                            pb={direction === "column" ? (index !== stackItems.length - 1 ? spacing ?? "0" : "0") : "0"}
                        >
                            {item}
                        </Box>
                    ))}
                </Box>
            );
        };

        export const Flex = (props: PropsWithChildren<BoxProps>) => <Box flexDirection="row" {...props} />;
        export const Inline = (props: PropsWithChildren<StackProps>) => <Stack flexDirection="row" {...props} />;

        export const Center = (props: PropsWithChildren<BoxProps>) => (
            <Box display="flex" justifyContent="center" alignItems="center" textAlign="center" {...props} />
        );
        `,
            { components: ["Box"] }
        )
    ).toMatchInlineSnapshot(`
      {
          transitiveMap: {
              Box: {
                  from: null,
                  referencedBy: ["Stack", "Flex", "Center"],
                  refUsedWithSpread: ["Stack", "Flex", "Center"],
              },
              Stack: {
                  from: "Box",
                  referencedBy: ["Inline"],
                  refUsedWithSpread: ["Inline"],
              },
              Flex: {
                  from: "Box",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              Center: {
                  from: "Box",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
              Inline: {
                  from: "Stack",
                  referencedBy: [],
                  refUsedWithSpread: [],
              },
          },
          names: ["Stack", "Flex", "Center", "Inline"],
      }
    `);
});
