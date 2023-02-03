import { coreThemeClass, properties } from "./django-theme";

export const DjangoApp = () => {
    // console.log(properties.config);

    return (
        <div className={coreThemeClass}>
            <div
                className={properties({
                    display: "flex",
                    flexDirection: "column",
                    padding: "200px",
                    backgroundColor: "error",
                    color: "red",
                    height: "10px",
                })}
            >
                django
            </div>
        </div>
    );
};
