import { createLogger } from "@box-extractor/logger";
import { evaluate } from "ts-evaluator";
import type { Expression, TypeChecker } from "ts-morph";
import { ts } from "ts-morph";

const TsEvalError = Symbol("EvalError");

const logger = createLogger("box-ex:extractor:evaluator");

/**
 * Evaluates with strict policies restrictions
 * @see https://github.com/wessberg/ts-evaluator#setting-up-policies
 */
const evaluateExpression = (node: Expression, morphTypeChecker: TypeChecker) => {
    const compilerNode = node.compilerNode;
    const typeChecker = morphTypeChecker.compilerObject;

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
            io: { read: false, write: false },
            process: { exit: false, spawnChild: false },
        },
    });

    logger({
        compilerNode: compilerNode.getText(),
        compilerNodeKind: node.getKindName(),
        result: result.success ? result.value : { name: result.reason.name, reason: result.reason.message },
    });
    return result.success ? result.value : TsEvalError;
};

export const safeEvaluateNode = <T>(node: Expression) => {
    const result = evaluateExpression(node, node.getProject().getTypeChecker());
    if (result === TsEvalError) return;
    return result as T;
};

export const evaluateNode = <T>(node: Expression) => evaluateExpression(node, node.getProject().getTypeChecker()) as T;
export const isEvalError = (value: unknown): value is typeof TsEvalError => value === TsEvalError;
