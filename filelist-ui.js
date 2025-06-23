


export function renderFileSelector(filelist, selectElem) {
    console.log('call renderFileSelector');
    selectElem.innerHTML = "";
    
    function readStructure(parent, child, path) {
        for ( const [key, value] of Object.entries(child) ) {
            if (typeof value === 'object' && value !== null) {
                const dir = document.createElement('optgroup');
                dir.setAttribute('id', key);
                dir.label = key;
                parent.appendChild(dir);
                const nextPath = path + '/' + key;
                readStructure(dir, value, nextPath);
            } else {
                console.log(path);
                console.log('value', value);
                console.log('typeof value', typeof value);
                
                const option = document.createElement('option');
                option.value = `${path}/${value}`;
                option.textContent = value;
                parent.appendChild(option);
            }
        }
    }

    const root = './inputs';
    readStructure(selectElem, filelist, root);

}