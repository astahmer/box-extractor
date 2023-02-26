import fs from "node:fs";
import { exec } from "node:child_process";

const cwd = process.cwd();

const rm = (path: string) => {
    if (fs.existsSync(path)) {
        exec(`rm -r ${path}`, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
};

const clean = (dir: string) => {
    rm(`${dir}/node_modules`);
    rm(`${dir}/dist`);
};

const cleanRoot = () => clean(cwd);

const cleanWorkSpaces = () => {
    const workspaces = ["./packages", "./examples"];

    workspaces.forEach((workspace) => {
        fs.readdir(workspace, (err, folders) => {
            folders.forEach((folder) => {
                console.log("cleaning", `${cwd}/${workspace}/${folder}`);
                clean(`${cwd}/${workspace}/${folder}`);
            });

            if (err) {
                throw err;
            }
        });
    });
};

cleanRoot();
cleanWorkSpaces();
