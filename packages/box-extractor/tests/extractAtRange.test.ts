import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, test } from "vitest";
import { extractAtRange, getTsNodeAtPosition } from "../src/extractor/extractAtRange";
import type { ExtractOptions } from "../src/extractor/types";

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

const config: ExtractOptions["components"] = {
    ColorBox: {
        properties: ["color", "backgroundColor", "zIndex", "fontSize", "display", "mobile", "tablet", "desktop", "css"],
    },
};
const getSourceFile = (code: string) => {
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    // return extract({ ast: sourceFile, components: config, ...options });
    return sourceFile;
};

const codeSample = `import Cylinder from "@/cylinder";
import Box from "src/box";
import { RoundedBox } from "@react-three/drei";
import Sphere from "./sphere";

export function SceneAlt() {
  return (
    <>
      <Box />
    </>
  );
}

export default function Scene() {
    const oui = abc({ prop: 123 });

  return (
    <>
      <factory.div className="aa" />
      <SceneAlt />
      <Box
        position={[
          -1.2466866852487384, 0.3325255778835592, -0.6517939595349769,
        ]}
        rotation={[
          2.1533738875424957, -0.4755261514452274, 0.22680789335122342,
        ]}
        scale={[1, 1, 1.977327619564505]}
        {...{ aaa: 123 }}
      />
      <Cylinder
        position={[0.47835635435693047, 0, -0.5445324755430057]}
      ></Cylinder>

      <Sphere
        scale={[0.6302165233139577, 0.6302165233139577, 0.6302165233139577]}
        position={[-1.6195773093872396, 0, 1.1107193822625767]}
      />

      <RoundedBox position={[1, 0, 2]}>
        <meshStandardMaterial color="purple" />
      </RoundedBox>
    </>
  );
}`;

test("getTsNodeAtPosition", () => {
    const sourceFile = getSourceFile(codeSample);
    let node;

    node = getTsNodeAtPosition(sourceFile, 1, 1);
    expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot('["import", "ImportKeyword"]');

    node = getTsNodeAtPosition(sourceFile, 15, 19);
    expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot('["abc", "Identifier"]');

    node = getTsNodeAtPosition(sourceFile, 19, 12);
    expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot('["factory", "Identifier"]');

    node = getTsNodeAtPosition(sourceFile, 20, 12);
    expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot('["SceneAlt", "Identifier"]');

    node = getTsNodeAtPosition(sourceFile, 31, 13);
    expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot('["Cylinder", "Identifier"]');

    node = getTsNodeAtPosition(sourceFile, 37, 14);
    expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot('["position", "Identifier"]');
});

test("extractAtRange", () => {
    const sourceFile = getSourceFile(codeSample);
    let extracted;

    extracted = extractAtRange(sourceFile, 1, 1);
    expect(extracted).toMatchInlineSnapshot("undefined");

    extracted = extractAtRange(sourceFile, 15, 19);
    expect(extracted).toMatchInlineSnapshot(`
      {
          stack: ["CallExpression", "ObjectLiteralExpression"],
          type: "map",
          node: "ObjectLiteralExpression",
          value: {
              prop: {
                  stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "NumericLiteral"],
                  type: "literal",
                  node: "NumericLiteral",
                  value: 123,
                  kind: "number",
              },
          },
      }
    `);

    extracted = extractAtRange(sourceFile, 19, 12);
    expect(extracted).toMatchInlineSnapshot(`
      {
          type: "component",
          node: "JsxSelfClosingElement",
          tagName: "factory.div",
          props: {
              className: {
                  stack: ["JsxAttribute", "StringLiteral"],
                  type: "literal",
                  node: "StringLiteral",
                  value: "aa",
                  kind: "string",
              },
          },
      }
    `);

    extracted = extractAtRange(sourceFile, 20, 12);
    expect(extracted).toMatchInlineSnapshot(`
      {
          type: "component",
          node: "JsxSelfClosingElement",
          tagName: "SceneAlt",
          props: {},
      }
    `);

    extracted = extractAtRange(sourceFile, 31, 13);
    expect(extracted).toMatchInlineSnapshot(`
      {
          type: "component",
          node: "JsxOpeningElement",
          tagName: "Cylinder",
          props: {
              position: {
                  stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                  type: "list",
                  node: "ArrayLiteralExpression",
                  value: [
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 0.47835635435693047,
                          kind: "number",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: 0,
                          kind: "number",
                      },
                      {
                          stack: ["JsxAttribute", "JsxExpression", "ArrayLiteralExpression"],
                          type: "literal",
                          node: "PrefixUnaryExpression",
                          value: -0.5445324755430057,
                          kind: "number",
                      },
                  ],
              },
          },
      }
    `);

    extracted = extractAtRange(sourceFile, 37, 14);
    expect(extracted).toMatchInlineSnapshot("undefined");
});
