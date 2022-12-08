import "./App.css";
import { VanillaThemeDemo } from "./components/VanillaThemeDemo";
// import { Demo } from "./components/Demo";
// import { MinimalSprinklesDemo } from "./components/MinimalSprinklesDemo";

function App() {
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* <Demo /> */}
            {/* <MinimalSprinklesDemo /> */}
            <VanillaThemeDemo />
        </div>
    );
}

export default App;
