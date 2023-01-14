import { button } from "./button.recipe.css";

// taken from https://vanilla-extract.style/documentation/packages/recipes/#recipe
export const WithRecipe = () => (
    <button className={button({ color: "accent", size: "large", rounded: true })}>Hello world</button>
);
