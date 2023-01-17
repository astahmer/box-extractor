import packageJson from "../../../packages/box-extractor/package.json";

const getPackageJsonVersion = () => ({ data: packageJson.version });
export default getPackageJsonVersion;
