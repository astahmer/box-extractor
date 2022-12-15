import "./App.css";
// import { VanillaThemeDemo } from "./components/VanillaThemeDemo";
// import { Demo } from "./components/Demo";
// import { MinimalSprinklesDemo } from "./components/MinimalSprinklesDemo";
import { BoxDemo } from "./components/BoxDemo";

function App() {
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", margin: "auto" }}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {/* <Demo /> */}
                        {/* <MinimalSprinklesDemo /> */}
                        {/* <VanillaThemeDemo /> */}
                        <BoxDemo />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
