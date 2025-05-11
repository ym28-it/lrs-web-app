# LRS Web Application

This repository hosts the WebAssembly version of the LRS (Lexicographic Reverse Search) tool, designed for use directly in a web browser. The project is deployed on GitHub Pages, making it easily accessible without the need for additional installations.

## Features

- Supports 64-bit and 128-bit arithmetic.
- Safe and Unsafe modes available for overflow checking.
- MP (Multiple Precision) version for high precision calculations.
- Fully implemented using WebAssembly (Wasm) for fast and efficient execution.
- Interactive web interface for input and output.

## Directory Structure

```
.
│  COPYING
│  directory_tree.txt
│  index.html
│  lrs-common.html
│  lrs-common.js
│  lrs-worker.js
│  mode-config.json
│  README.md
│  script.js
│  
├─css
│      style.css
│
├─experiment
│      chart.js
│      experiment.html
│      experiment.js
│      experiment2.js
│      experiment3.js
│
├─ext
│  ├─metric
│  │
│  ├─redund
│  │
│  ├─test
│  │
│  └─tsp
│
├─for-dev
│  │  directory_tree.txt
│  │  test-common.html
│  │  test-common.js
│  │  test-config.json
│  │  test-index.html
│  │  test-index.js
│  │  test-worker.js
│  │
│  └─test-modules
│          lrsmp64.js
│          lrsmp64.wasm
│
├─images
│  ├─github-mark
│  │      github-mark-white.png
│  │      github-mark-white.svg
│  │      github-mark.png
│  │      github-mark.svg
│  │
│  └─__MACOSX
│      │  ._github-mark
│      │
│      └─github-mark
│              ._github-mark-white.png
│              ._github-mark-white.svg
│              ._github-mark.png
│              ._github-mark.svg
│
├─ine
│  ├─afsa
│  │
│  ├─metric
│  │
│  ├─mit
│  │
│  ├─polybase
│  │
│  ├─project
│  │  │
│  │  ├─hec
│  │  │
│  │  └─ieq
│  │
│  ├─redund
│  │  │
│  │  └─hidden
│  │
│  ├─test
│  │
│  ├─test-062
│  │  │
│  │  ├─normaliz
│  │  │
│  │  └─porta
│  │
│  └─test-072
│
├─js
├─modules
│  ├─v7.3
│  │      hybrid-gmp.js
│  │      hybrid-gmp.wasm
│  │      hybrid-minigmp.js
│  │      hybrid-minigmp.wasm
│  │      lrs-gmp.js
│  │      lrs-gmp.wasm
│  │      lrs-long128-safe.js
│  │      lrs-long128-safe.wasm
│  │      lrs-long128-unsafe.js
│  │      lrs-long128-unsafe.wasm
│  │      lrs-long64-safe.js
│  │      lrs-long64-safe.wasm
│  │      lrs-long64-unsafe.js
│  │      lrs-long64-unsafe.wasm
│  │      lrs-minigmp.js
│  │      lrs-minigmp.wasm
│  │      lrs-mp64.js
│  │      lrs-mp64.wasm
│  │
│  └─v7.4
└─tests
```

## Getting Started

This project is deployed via GitHub Pages. To access the deployed version, visit:

[https://github.com/ym28-it/lrs-web-app.io](https://ym28-it.github.io/lrs-web-app/)

## Usage

### Input

Enter the input data in the text area labeled `Input`. The data format should follow the standard LRS input format.

You can upload input file on your computer.

### Execution

Click the `Submit` button to execute the program. The output will be displayed in the `Output` text area.

You can also do it by pressing Ctrl+Enter (Cmd+Enter).

### Modules

- **hybrid GMP**
- **hybrid miniGMP**
- **lrs mp64bit**
- **lrs long64bit**
- **lrs long128bit**
- **lrs gmp**
- **lrs minigmp**

### Modes (lrs long　only)

- **Safe Mode**: Provides overflow checking for arithmetic operations.
- **Unsafe Mode**: Does not perform overflow checks, offering potentially faster computations.

## Development

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge).
- Basic knowledge of JavaScript and WebAssembly.

### Building from Source

1. Install

   ```bash
   apt install -y git python3 xz-utils tar
   git clone https://github.com/emscripten-core/emsdk.git
   ```
   
2. Setup env

   ```bash
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```
   
3. Download the source files for LRS from [here](https://cgm.cs.mcgill.ca/~avis/C/lrslib/archive/lrslib-073.tar.gz):

   ```bash
   wget https://cgm.cs.mcgill.ca/~avis/C/lrslib/archive/lrslib-073.tar.gz
   ```

4. Extract the downloaded archive:

   ```bash
   tar -xvzf lrslib-073.tar.gz
   ```

5. Modify makefile and compile the LRS C code to WebAssembly:

   ```makefile
   CC = emcc
   CFLAGS = -O2 -Wall -s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT="web" -s SAFE_HEAP=1 -s STACK_SIZE=8388608 \
         -s EXPORTED_RUNTIME_METHODS="['FS', 'callMain']" -I./lrsarith-011
   lrs: ${LRSOBJ} ${LRSOBJ2}
	      $(CC) ${CFLAGS} ${PLRSFLAGS} -DMA ${BITS} -L${LIBDIR} -o lrs.js ${LRSOBJ} ${LRSOBJ2} ${MINI} ${GMP}
   ```

   ```bash
   make lrs
   ```

6. Replace the JavaScript and WebAssembly files in the respective directories.

## Source Code Attribution

This project uses the `lrslib` library, version 0.73, obtained from the following source:

- URL: [https://cgm.cs.mcgill.ca/~avis/C/lrslib/archive/lrslib-073.tar.gz](https://cgm.cs.mcgill.ca/~avis/C/lrslib/archive/lrslib-073.tar.gz)
- License: GNU General Public License Version 2 (included in the `COPYING` file)

For more details, see the original [lrslib website](https://cgm.cs.mcgill.ca/~avis/C/lrs.html).

## Limitations

While this project implements many features of the original `lrslib`, it does not yet support certain advanced functionalities, such as:

- Parallel computation not supported

These features remain as potential future enhancements to this WebAssembly version.

## Change Log

### January 21, 2025

- Enabled output installation functionality.
- Added support for uploading input files.
- Implemented the ability to execute commands with `Ctrl+Enter`.

### January 28, 2025

- Added Hybrid Mode for combining different arithmetic modes to optimize performance.

### Apr 12, 2025

- Integrate common parts of JavaScript and HTML
- Differences are managed in the mode-config.json file

## License

This project is licensed under the GNU General Public License Version 2. See the `COPYING` file for details.

## Contributing

Contributions are welcome! Please submit issues or pull requests to improve the project.
