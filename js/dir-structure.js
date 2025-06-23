// import { getEnvironmentType } from "./env-detect.js";
// import { fetchAndBuildFromDirListing } from "./create_dir_structure.js";

export async function getFileListJSON() {
    return fetch('./filelist.json').then(res => res.json());
}

// export async function getFileListJSON() {
//     const env = getEnvironmentType();
//     if (env === 'github') {
//         console.log('env: github');
//         return fetch("./inputs/filelist.json").then(res => res.json());
//     } else if (env === 'cgm') {
//         console.log('env: cgm');
//         return await fetchAndBuildFromDirListing();
//     } else if (env === 'dev') {
//         console.log('env: dev');
//         // return fetch('./inputs/filelist.json').then(res => res.json());
//         return await fetchAndBuildFromDirListing();
//     } else {
//         console.log('Unknown environment', env);
//         throw new Error('Unknown environment');
//     }
    
// }
