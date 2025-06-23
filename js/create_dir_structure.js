
const fileStructure = {};
function saveFileStructure(path, files) {
    const relative = path.replace(/^inputs\//, "").replace(/\/$/, "");
    const [top, ...sub] = relative.split('/');
    const subKey = sub.join('/');
    if (!fileStructure[top]) {
        fileStructure[top] = {};
    }
    fileStructure[top][subKey] = files;
}

function searchDir(path) {
    console.log('call searchDir', path);
    return fetch(path)
        .then(res => res.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, "text/html");
            const links = Array.from(doc.querySelectorAll('a'));
            
            console.log('Links from parse', links);
        })
}


function searchDir_test(path) {
    return fetch(path)
        .then(res => res.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, "text/html");
            const links = Array.from(doc.querySelectorAll('a'));
            const files = [];
            const dirs = [];

            links.forEach(link => {
                const href = link.getAttribute('href');
                if (!href || href.includes('..')) return;
                if (href.endsWith('/')) {
                    dirs.push(href);
                } else {
                    files.push(href);
                }
            });

            saveFileStructure(path, files)

            const subPromises = dirs.forEach(dir => {
                searchDir(`${path}/${dir}`);
            });
            return Promise.all(subPromises);
        })
        .catch(err => {
            console.error('Error in searchDir', err);
            throw err;
        });
}

export function fetchAndBuildFromDirListing() {
    const root = './inputs';
    return searchDir(root).then(() => fileStructure);
}
