import { normalizeProps, useMachine } from "@zag-js/react";
import * as toggle from "@zag-js/toggle";
import { useId } from "react";
import { Box } from "./Box";
import { switchThumb } from "./Switch.css";

export const Switch = (props: Partial<toggle.Context>) => {
    const id = useId();
    const [state, send] = useMachine(toggle.machine({ id, ...props }));

    const { buttonProps } = toggle.connect(state, send, normalizeProps);

    return (
        <Box
            {...(buttonProps as any)}
            onClick={() => {
                if (state.context.disabled) return;
                const isPressed = state.matches("pressed");
                send({ type: "TOGGLE", pressed: isPressed });
                props.onChange?.({ pressed: !isPressed });
            }}
            as="button"
            className="SwitchRoot"
            id={props?.ids?.button ?? buttonProps.id ?? id}
            width="42px"
            height="25px"
            backgroundColor="blackAlpha.500"
            borderRadius="full"
            position="relative"
            boxShadow="md"
            _focus={{ boxShadow: "lg" }}
            _pressed={{ backgroundColor: "blackAlpha.700" }}
            p="0"
        >
            <Box
                data-pressed={(buttonProps as any)["data-pressed"]}
                className={switchThumb}
                backgroundColor="white"
                borderRadius="full"
                boxShadow="md"
            />
        </Box>
    );
};
