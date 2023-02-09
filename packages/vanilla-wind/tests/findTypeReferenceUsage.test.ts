import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, test } from "vitest";
import { findTypeReferenceUsage } from "../src/findTypeReferenceUsage";

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
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
        skipLoadingLibFiles: true,
    });
};

let project: Project = createProject();

let sourceFile: SourceFile;
afterEach(() => {
    if (!sourceFile) return;

    if (sourceFile.wasForgotten()) return;
    project.removeSourceFile(sourceFile);
});

test("can extract a TypeAliasDeclaration & find the component references where its used", () => {
    const codeSample = `import type { WithStyledProps } from "@box-extractor/vanilla-wind";
    import { Children, PropsWithChildren, ReactNode } from "react";
    import type { PolymorphicComponentProps } from "./Box";
    import { Box } from "./Box";
    import type { css } from "./theme";

    type BoxProps = WithStyledProps<typeof css>;
    type StackProps = Omit<BoxProps, "align"> & {
        children: ReactNode;
        spacing?: BoxProps["paddingBottom"];
    };
    const defaultElement = "div";

    // https://github.com/vanilla-extract-css/vanilla-extract/blob/98f8b0387d661b77705d2cd83ab3095434e1223e/site/src/system/Stack/Stack.tsx#L32
    export const Stack = <TType extends React.ElementType = typeof defaultElement>(
        props: PolymorphicComponentProps<StackProps, TType>
    ) => {
        const { children, as, _styled, spacing, ...rest } = props;
        const stackItems = Children.toArray(children);
        const direction = props.flexDirection ?? "column";

        return (
            <Box
                display="flex"
                flexDirection={direction}
                {...rest}
                // className={_styled}
            >
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

    const NotUsingBoxProps = (props: any) => {
        return <Box color="red" />;
    };

    export const Center = (props: PropsWithChildren<BoxProps>) => (
        <Box display="flex" justifyContent="center" alignItems="center" textAlign="center" {...props} />
    );

    export const Flex = (props: PropsWithChildren<BoxProps>) => (
        <Box display="flex"  {...props} />
    );

    const anotherThemeFn = defineProperties();

    export const AnotherComponent = (props: WithStyledProps<typeof anotherThemeFn>) => {
        return <Box color="green" />;
    };
    `;

    const sourceFile = project.createSourceFile("ref-usage.ts", codeSample, { scriptKind: ts.ScriptKind.TSX });
    const result = findTypeReferenceUsage(sourceFile, "WithStyledProps");

    expect(result).toMatchInlineSnapshot(`
      {
          Stack: "css",
          Center: "css",
          Flex: "css",
          AnotherComponent: "anotherThemeFn",
      }
    `);
});
