import * as tagsInput from "@zag-js/tags-input";
import { useMachine, normalizeProps } from "@zag-js/react";
import { useId } from "react";
import { box } from "../theme/Box";
// import { box } from "../theme/Box";

export function TagsInput({ placeholder, ...props }: Partial<tagsInput.Context> & { placeholder?: string }) {
    const [state, send] = useMachine(tagsInput.machine({ id: useId(), ...props }));
    const api = tagsInput.connect(state, send, normalizeProps);

    return (
        <div {...api.rootProps}>
            {api.value.map((value, index) => (
                <span key={index}>
                    <div {...api.getTagProps({ index, value })}>
                        <span>{value} </span>
                        <button {...api.getTagDeleteTriggerProps({ index, value })}>&#x2715;</button>
                    </div>
                    <input {...api.getTagInputProps({ index, value })} />
                </span>
            ))}
            <input placeholder={placeholder ?? "Add tag..."} {...api.inputProps} />
        </div>
    );
}

// TODO
export function TagsInput2(props: any) {
    const [state, send] = useMachine(
        tagsInput.machine({
            id: useId(),
            value: ["React", "Vue"],
        }),
        { context: props.controls }
    );

    const api = tagsInput.connect(state, send, normalizeProps);

    return (
        <box.div width="400px">
            <box.div {...(api.rootProps as any)}>
                <label {...api.labelProps}>Enter frameworks:</label>
                <box.div
                    className="focus-outline"
                    {...(api.controlProps as any)}
                    bg="white"
                    borderWidth="1px"
                    mt="2"
                    py="2px"
                    paddingLeft="1"
                >
                    {api.value.map((value, index) => {
                        const opt = { index, value };

                        return (
                            <span key={index}>
                                <box.div
                                    bg="gray.100"
                                    px="2"
                                    display="inline-block"
                                    margin="4px"
                                    _selected={{ bg: "green.200" }}
                                    _disabled={{ opacity: "0.6" }}
                                    {...(api.getTagProps(opt) as any)}
                                >
                                    <span>{value}</span>
                                    <box.button ml="1" {...(api.getTagDeleteTriggerProps(opt) as any)}>
                                        &#x2715;
                                    </box.button>
                                </box.div>
                                <box.input px="2" width="10" outline="0" {...(api.getTagInputProps(opt) as any)} />
                            </span>
                        );
                    })}
                    <box.input
                        margin="4px"
                        px="2"
                        placeholder="Add tag..."
                        _focus={{ outline: "none" }}
                        {...(api.inputProps as any)}
                    />
                </box.div>
            </box.div>
        </box.div>
    );
}
