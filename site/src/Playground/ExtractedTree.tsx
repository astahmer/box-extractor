import {
    BoxNode,
    BoxNodesMap,
    getBoxLiteralValue,
    LiteralType,
    ObjectType,
    ConditionalType,
    ListType,
    MapType,
} from "@box-extractor/core";
import type { EmptyInitializerType } from "@box-extractor/core/dist/declarations/src/extractor/type-factory";
import { useState } from "react";
import { match } from "ts-pattern";
import { Box } from "../theme/Box";
import { Stack } from "../theme/components";
import { Switch } from "../theme/Switch";
import { usePlaygroundContext } from "./Playground.machine";

export const ExtractedTreeCompact = ({ extracted }: { extracted: BoxNodesMap }) => {
    const entries = Array.from(extracted.entries());

    return (
        <Stack spacing="4" overflow="auto" boxSize="100%" pt="2" pb="10">
            {entries.map(([name, map]) => {
                return (
                    <Box
                        key={name}
                        pl="6"
                        pt="6"
                        backgroundColor={{ light: "brand.500", dark: "brand.700" }}
                        _light={{ color: "blue.300" }}
                        p="4"
                        borderRadius="lg"
                    >
                        <Box fontWeight="bold" fontSize="lg">
                            {name} ({map.kind})
                        </Box>
                        <Stack spacing="2" pt="2">
                            {Array.from(map.nodesByProp.entries()).map(([propName, nodeList]) => {
                                return (
                                    <Box
                                        key={propName}
                                        pl="6"
                                        backgroundColor={{ light: "brand.600", dark: "brand.800" }}
                                        p="2"
                                        display="flex"
                                        borderRadius="lg"
                                    >
                                        <Box fontWeight="bold" fontSize="md">
                                            {propName} ({nodeList.length}):{" "}
                                            {JSON.stringify(
                                                nodeList.map((node) => getBoxLiteralValue(node)),
                                                null,
                                                2
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                );
            })}
        </Stack>
    );
};

export const ExtractedTree = ({ extracted }: { extracted: BoxNodesMap }) => {
    const entries = Array.from(extracted.entries());
    const [isOpen, setOpen] = useState(true);

    return (
        <Stack spacing="4" overflow="auto" boxSize="100%" pt="2" pb="10">
            {entries.map(([name, map]) => {
                return (
                    <Box
                        key={name}
                        pl="6"
                        pt="6"
                        backgroundColor={{ light: "brand.500", dark: "brand.700" }}
                        _light={{ color: "blue.300" }}
                        p="4"
                        borderRadius="lg"
                    >
                        <Box display="flex" alignItems="center">
                            <Box
                                borderRadius="md"
                                p="2"
                                _hover={{ backgroundColor: "brand.400", color: "white" }}
                                as="label"
                                cursor="pointer"
                                htmlFor={`${name}_switch`}
                                fontWeight="bold"
                                fontSize="lg"
                            >
                                {name} ({map.kind})
                            </Box>
                            <Box ml="auto">
                                <Switch
                                    ids={{ button: `${name}_switch` }}
                                    defaultPressed={isOpen}
                                    onChange={(details) => {
                                        console.log(extracted);
                                        setOpen(details.pressed);
                                    }}
                                />
                            </Box>
                        </Box>
                        {isOpen ? (
                            <Stack spacing="4" pt="4">
                                {Array.from(map.nodesByProp.entries()).map(([propName, nodeList]) => {
                                    return (
                                        <PropNode name={name} key={propName} propName={propName} nodeList={nodeList} />
                                    );
                                })}
                            </Stack>
                        ) : null}
                    </Box>
                );
            })}
        </Stack>
    );
};

const PropNode = ({ name, propName, nodeList }: { name: string; propName: string; nodeList: BoxNode[] }) => {
    const [isOpen, setOpen] = useState(true);
    const service = usePlaygroundContext();

    return (
        <Box
            pl="4"
            backgroundColor={{ light: "brand.500", dark: "brand.700" }}
            _light={{ color: "blue.300" }}
            borderRadius="lg"
        >
            <Box
                backgroundColor={{ light: "brand.600", dark: "brand.800" }}
                p="2"
                display="flex"
                alignItems="center"
                borderRadius="lg"
            >
                <Box
                    borderRadius="md"
                    p="2"
                    _hover={{ backgroundColor: "brand.400", color: "white" }}
                    fontWeight="bold"
                    fontSize="md"
                    as="label"
                    cursor="pointer"
                    htmlFor={`${name}_${propName}_switch`}
                    onClick={(e) => {
                        if (isOpen) {
                            e.preventDefault();
                        }

                        service.send({ type: "Select prop", identifier: name, prop: propName });
                    }}
                >
                    {propName} ({nodeList.length})
                </Box>
                <Box ml="auto">
                    <Switch
                        ids={{ button: `${name}_${propName}_switch` }}
                        defaultPressed={isOpen}
                        onChange={(details) => {
                            console.log(nodeList);
                            setOpen(details.pressed);
                        }}
                    />
                </Box>
            </Box>
            {isOpen ? (
                <Stack spacing="2" pt="4">
                    {nodeList.map((node, nodeIndex) => {
                        return <BoxNodeItem key={nodeIndex} name={name} propName={propName} node={node} />;
                    })}
                </Stack>
            ) : null}
        </Box>
    );
};

const BoxNodeItem = ({ name, propName, node }: { name: string; propName: string; node: BoxNode }) => {
    const service = usePlaygroundContext();
    // const tsNode = node.getNode()

    return (
        <Box ml="6" p="2" backgroundColor={{ light: "brand.600", dark: "brand.800" }} borderRadius="lg">
            <Box
                onClick={() => {
                    service.send({ type: "Select node", identifier: name, prop: propName, node });
                }}
                borderRadius="md"
                p="2"
                _hover={{ backgroundColor: "brand.400", color: "white" }}
                cursor="pointer"
                fontWeight="bold"
                fontSize="sm"
                data-type={node.type}
            >
                {node.type !== "literal" && (node.type === "object" ? !node.isEmpty : true) ? (
                    <span>{node.type}</span>
                ) : null}
                {match(node.type)
                    .with("object", () => (
                        <BoxNodeObjectType name={name} propName={propName} node={node as ObjectType} />
                    ))
                    .with("literal", () => (
                        <BoxNodeLiteral name={name} propName={propName} node={node as LiteralType} />
                    ))
                    .with("list", () => <BoxNodeArray name={name} propName={propName} node={node as ListType} />)
                    .with("map", () => <BoxNodeMapType name={name} propName={propName} node={node as MapType} />)
                    .with("conditional", () => (
                        <BoxNodeCondtionalType name={name} propName={propName} node={node as ConditionalType} />
                    ))
                    .with("empty-initializer", () => (
                        <BoxNodeEmptyInitializer name={name} propName={propName} node={node as EmptyInitializerType} />
                    ))
                    .with("unresolvable", () => <div>unresolvable</div>)
                    .exhaustive()}
            </Box>
        </Box>
    );
};

const BoxNodeObjectType = ({ name, propName, node }: { name: string; propName: string; node: ObjectType }) => {
    // const service = usePlaygroundContext();
    console.log({ name, propName, value: node });

    if (node.isEmpty) return <span>empty object</span>;

    return (
        <Box pl="4">
            <Stack spacing="2">
                {Object.entries(node.value).map(([key, value]) => {
                    const maybeSingle = Array.isArray(value) && value.length === 1 ? value[0] : value;

                    return (
                        <Box key={key} display="flex" alignItems="center">
                            <Box fontWeight="bold" marginRight="2">
                                {key}
                            </Box>
                            <pre>{JSON.stringify(maybeSingle, null, 2)}</pre>
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
};

const BoxNodeMapType = ({ name, propName, node }: { name: string; propName: string; node: MapType }) => {
    // const service = usePlaygroundContext();

    return (
        <Stack pl="4" spacing="2">
            {Array.from(node.value.entries()).map(([key, value]) => {
                return (
                    <Box key={key} display="flex" alignItems="center">
                        <Box fontWeight="bold" marginRight="2">
                            {key}
                        </Box>
                        {value.map((innerNode, index) => (
                            <BoxNodeItem key={index} name={name} propName={propName} node={innerNode} />
                        ))}
                    </Box>
                );
            })}
        </Stack>
    );
};

const BoxNodeArray = ({ name, propName, node }: { name: string; propName: string; node: ListType }) => {
    // const service = usePlaygroundContext();

    return (
        <Stack pl="4" spacing="2">
            {node.value.map((innerNode, valueIndex) => {
                return (
                    <Box key={valueIndex} display="flex" alignItems="center">
                        <Box fontWeight="bold" marginRight="2">
                            {valueIndex}
                        </Box>
                        <BoxNodeItem name={name} propName={propName} node={innerNode} />
                    </Box>
                );
            })}
        </Stack>
    );
};

const BoxNodeLiteral = ({ name, propName, node }: { name: string; propName: string; node: LiteralType }) => {
    // const service = usePlaygroundContext();

    return (
        <Box display="flex" alignItems="center">
            <Box fontWeight="bold" marginRight="2">
                literal
            </Box>
            <pre>{JSON.stringify(node.value, null, 2)}</pre>
        </Box>
    );
};

const BoxNodeEmptyInitializer = ({
    name,
    propName,
    node,
}: {
    name: string;
    propName: string;
    node: EmptyInitializerType;
}) => {
    // const service = usePlaygroundContext();

    return (
        <Stack pl="4" spacing="2">
            <Box display="flex" alignItems="center">
                <Box fontWeight="bold" marginRight="2">
                    value
                </Box>
                <span>empty initializer</span>
            </Box>
        </Stack>
    );
};

const BoxNodeCondtionalType = ({ name, propName, node }: { name: string; propName: string; node: ConditionalType }) => {
    // const service = usePlaygroundContext();

    return (
        <Stack pl="4" spacing="2">
            <Box display="flex" alignItems="center">
                <Box fontWeight="bold" marginRight="2">
                    whenTrue
                </Box>
                <BoxNodeItem name={name} propName={propName} node={node.whenTrue} />
            </Box>
            <Box display="flex" alignItems="center">
                <Box fontWeight="bold" marginRight="2">
                    whenFalse
                </Box>
                <BoxNodeItem name={name} propName={propName} node={node.whenFalse} />
            </Box>
        </Stack>
    );
};
