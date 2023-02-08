import { css } from "../theme/theme";

export default function Page() {
    return <div className={css({ color: "bgSecondary", hover: { color: "bgHover" } })}>home</div>;
}
