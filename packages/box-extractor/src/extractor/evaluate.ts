import { createLogger } from "@box-extractor/logger";
import { evaluate } from "ts-evaluator";
import type { Expression, TypeChecker } from "ts-morph";
import { ts } from "ts-morph";

const TsEvalError = Symbol("EvalError");
const logger = createLogger("box-ex:extractor:evaluator");

// replaced dyanmicaly
const envPreset = "__REPLACE_ME_TS_EVAL_PRESET_";

const cacheMap = new WeakMap<Expression, unknown>();

/**
 * Evaluates with strict policies restrictions
 * @see https://github.com/wessberg/ts-evaluator#setting-up-policies
 */
const evaluateExpression = (node: Expression, morphTypeChecker: TypeChecker) => {
    const compilerNode = node.compilerNode;
    const typeChecker = morphTypeChecker.compilerObject;

    if (cacheMap.has(node)) {
        return cacheMap.get(node);
    }

    const result = evaluate({
        node: compilerNode as any,
        typeChecker: typeChecker as any,
        typescript: ts as any,
        policy: {
            deterministic: true,
            network: false,
            console: false,
            maxOps: Number.POSITIVE_INFINITY,
            maxOpDuration: 1000,
            io: { read: true, write: false },
            process: { exit: false, spawnChild: false },
        },
        environment: {
            preset: envPreset.startsWith("__REPLACE_ME_") ? "NODE" : (envPreset as any),
        },
    });

    logger({ compilerNodeKind: node.getKindName() });
    if (result.success) {
        logger.scoped("success", result.value);
    } else {
        logger.scoped("error", result.reason.stack);
        logger.lazyScoped("error-reason", () => ({
            result: {
                name: result.reason.name,
                reason: result.reason.message,
                atNode: {
                    path: result.reason.node.getSourceFile().fileName + ":" + result.reason.node.getFullStart(),
                    start: result.reason.node.getFullStart(),
                    end: result.reason.node.getEnd(),
                    // text: result.reason.node.getText().slice(0, 100),
                    kind: ts.SyntaxKind[result.reason.node.kind],
                },
            },
        }));

        if (logger.isEnabled(logger.namespace + ":trace")) {
            logger.scoped("trace");
            console.trace();
        }
    }

    const expr = result.success ? result.value : TsEvalError;
    cacheMap.set(node, expr);

    return expr;
};

export const safeEvaluateNode = <T>(node: Expression) => {
    const result = evaluateExpression(node, node.getProject().getTypeChecker());
    if (result === TsEvalError) return;
    return result as T;
};

export const evaluateNode = <T>(node: Expression) => evaluateExpression(node, node.getProject().getTypeChecker()) as T;
export const isEvalError = (value: unknown): value is typeof TsEvalError => value === TsEvalError;
