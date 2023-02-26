import rimraf from "rimraf";
import fg from "fast-glob";

const clean = async () => {
    console.log("cleaning...");
    await fg
        .sync(["./node_modules", "./packages/*/{node_modules,dist}", "./examples/*/{node_modules,dist}"], {
            onlyDirectories: true,
        })
        .map((dir) => {
            console.log({ dir });
            return rimraf(dir);
        });
    console.log("cleaned");
};

clean();
