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
├── lrs-index.html         # Main index page for navigation.
├── README.md              # Documentation for the project.
├── mp64/                  # Directory for MP (Multiple Precision) version.
│   ├── lrs-mp64.html
│   ├── lrs64.js
│   └── lrs64.wasm
├── long64/                # Directory for 64-bit versions.
│   ├── lrs-long64-safe.html
│   ├── lrs-long64-unsafe.html
│   ├── lrs64-safe.js
│   ├── lrs64-unsafe.js
│   ├── lrs64-safe.wasm
│   ├── lrs64-unsafe.wasm
│   └── lrs64.wasm
├── long128/               # Directory for 128-bit versions.
│   ├── lrs-long128-safe.html
│   ├── lrs-long128-unsafe.html
│   ├── lrs128-safe.js
│   ├── lrs128-unsafe.js
│   ├── lrs128-safe.wasm
│   └── lrs128-unsafe.wasm
```

## Getting Started

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/lrs-web-app.git
   ```

2. Open `lrs-index.html` in your browser to access the main navigation page.

## Usage

### Input

Enter the input data in the text area labeled `Input`. The data format should follow the standard LRS input format.

### Execution

Click the `Submit` button to execute the program. The output will be displayed in the `Output` text area.

### Modes

- **Safe Mode**: Provides overflow checking for arithmetic operations.
- **Unsafe Mode**: Does not perform overflow checks, offering potentially faster computations.

## Deployment

This project is deployed via GitHub Pages. To access the deployed version, visit:

```
https://yourusername.github.io/lrs-web-app/
```

## Development

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge).
- Basic knowledge of JavaScript and WebAssembly.

### Building from Source

1. Install [Emscripten](https://emscripten.org/).
2. Download the source files for LRS from [here](https://cgm.cs.mcgill.ca/~avis/C/lrslib/archive/lrslib-073.tar.gz):

   ```bash
   wget https://cgm.cs.mcgill.ca/~avis/C/lrslib/archive/lrslib-073.tar.gz
   ```

3. Extract the downloaded archive:

   ```bash
   tar -xvzf lrslib-073.tar.gz
   ```

4. Navigate to the extracted directory and compile the LRS C code to WebAssembly:

   ```bash
   cd lrslib-073
   emcc input-file.c -o output-file.js -s EXPORTED_RUNTIME_METHODS="['FS', 'callMain']" -s ENVIRONMENT="web" -s ALLOW_MEMORY_GROWTH=1
   ```

5. Replace the JavaScript and WebAssembly files in the respective directories.

## Source Code Attribution

This project uses the `lrslib` library, version 0.73, obtained from the following source:

- URL: [https://cgm.cs.mcgill.ca/~avis/C/lrslib/archive/lrslib-073.tar.gz](https://cgm.cs.mcgill.ca/~avis/C/lrslib/archive/lrslib-073.tar.gz)
- License: GNU General Public License Version 2 (included in the `COPYING` file)

For more details, see the original [lrslib website](https://cgm.cs.mcgill.ca/~avis/C/lrs.html).

## Limitations

While this project implements many features of the original `lrslib`, it does not yet support certain advanced functionalities, such as:

- **Hybrid Mode**: Combining different arithmetic modes for optimized performance.
- **GMP (GNU Multiple Precision) Mode**: Utilizing GMP for highly accurate calculations with arbitrary precision.

These features remain as potential future enhancements to this WebAssembly version.

## License

This project is licensed under the GNU General Public License Version 2. See the `COPYING` file for details.

## Contributing

Contributions are welcome! Please submit issues or pull requests to improve the project.
