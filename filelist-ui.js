


export function renderFileSelector(filelist, selectElem) {
    console.log('call renderFileSelector');
    const data = [filelist]
    selectElem.style.maxHeight = '200px'; // 縦幅上限
    selectElem.style.overflowY = 'auto';  // スクロール
    selectElem.style.border = '1px solid rgb(118, 118, 118),';

    addMenu(selectElem, data);
    console.log('filelist', filelist);

}


function addMenu(parent, items) {
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.paddingLeft = '1em';

    for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item.Name;
        li.style.cursor = 'pointer';
        li.style.padding = '4px';

        
        if (item.Children && Array.isArray(item.Children)) {
            // 子ディレクトリあり → 展開ボタンを追加
            const toggle = document.createElement('span');
            toggle.textContent = "📁 " + item.Name; // フォルダアイコン
            toggle.style.cursor = 'pointer';
            toggle.style.fontWeight = 'bold';

            toggle.addEventListener('mouseenter', () => {
                toggle.style.color = 'rgba(0, 0, 0, 0.5)';
            });
            toggle.addEventListener('mouseleave', () => {
                toggle.style.color = '';
            });


            const subUl = document.createElement('ul');
            subUl.style.display = 'none'; // 初期は閉じる

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                subUl.style.display = subUl.style.display === 'block' ? 'none' : 'block';
            });

            li.innerHTML = '';
            li.appendChild(toggle);
            li.appendChild(subUl);

            // 再帰で子階層を追加
            addMenu(subUl, item.Children);
        } else {
            // ファイル（Childrenなし）
            li.textContent = "📄 " + item.Name; // ファイルアイコン
            li.addEventListener('mouseenter', () => {
                li.style.color = 'rgba(0, 0, 0, 0.5)';
            });
            li.addEventListener('mouseleave', () => {
                li.style.color = '';
            });

            li.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log("Selected file:", item.Name);
                const inputArea = document.getElementById('inputArea');
                const fileName = document.getElementById('selected-file-name');
                fileName.textContent = item.Name;

                const outputArea = document.getElementById('outputArea');
                outputArea.value = '';
                const uploadFile = document.getElementById('fileInput');
                uploadFile.value = '';

                fetch(item.Path)
                    .then(res => res.text())
                    .then(data => {
                        inputArea.value = data;
                    })
                
                if (window.Swal) {
                    Swal.close();
                }
            });
        }

        ul.appendChild(li);
    }

    parent.appendChild(ul);
}
