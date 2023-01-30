import { useState } from "react";
import "./App.css";
import { tw } from "./theme";

function App() {
    const className = tw({ display: "flex", color: "orange" });
    console.log({ className, another: tw({ color: "pink" }) }, "yes");

    const [state, setState] = useState(0);
    console.log(state);

    return (
        <div className={tw({ display: "flex", flexDirection: "column", height: "100%" })}>
            <div className={tw({ display: "flex", flexDirection: "column", height: "100%" })}>
                <div className={tw({ display: "flex", flexDirection: "column", margin: "auto" })}>
                    <div className={tw({ display: "flex", flexDirection: "column", justifyContent: "center" })}>
                        <span className={tw({ color: "blue.500" })}>yes</span>
                        <span onClick={() => setState((current) => current + 1)} className={tw({ color: "pink" })}>
                            class: ({className})
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
