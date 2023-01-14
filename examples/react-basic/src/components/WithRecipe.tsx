import { button, multiple, row } from "./button.recipe.css";

// taken from https://vanilla-extract.style/documentation/packages/recipes/#recipe
export const WithRecipe = () => (
    <div>
        <button className={button({ color: "accent", size: "large", rounded: true })}>Hello world</button>
        <div className={multiple({ first: "colored" })} />
        <div className={row()} />
    </div>
);
