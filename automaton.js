document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        width = canvas.width;
        height = canvas.height;
        cols = Math.floor(width / cellSize);
        rows = Math.floor(height / cellSize);
        initializeGrid();
        drawGrid();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const cellSize = 4; // size of each cell in pixels
    const toolSize = 4; // size of the eraser and adder
    let width = canvas.width;
    let height = canvas.height;
    let cols = Math.floor(width / cellSize);
    let rows = Math.floor(height / cellSize);
    let frameRate = 10; // target frame rate in frames per second
    let frameDuration = 1000 / frameRate;
    let lastFrameTime = 0;

    let grid = new Array(rows).fill(null).map(() => new Array(cols).fill(0));

    // Get UI elements
    const startPauseButton = document.getElementById('startPauseButton');
    const resetButton = document.getElementById('resetButton');
    const speedSlider = document.getElementById('speedSlider');
    const patternSelect = document.getElementById('patternSelect');

    let isPaused = false;

    const patterns = {
        'glider': [
            [0,1,0],
            [0,0,1],
            [1,1,1]
        ],
        'lwss': [
            [0,1,0,0,1],
            [1,0,0,0,0],
            [1,0,0,0,1],
            [1,1,1,1,0]
        ]
    };

    let mouseX = 0;
    let mouseY = 0;
    let mouseCol = 0;
    let mouseRow = 0;
    let mouseOverCanvas = false;
    let isMouseDown = false;
    let currentPatternTransformed = null;

    function initializeGrid() {
        grid = new Array(rows).fill(null).map(() => new Array(cols).fill(0));
    }

    function drawGrid() {
        ctx.clearRect(0, 0, width, height); // Clear the canvas

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const color = grid[y][x] * 255;
                for (let dy = 0; dy < cellSize; dy++) {
                    for (let dx = 0; dx < cellSize; dx++) {
                        const index = 4 * ((y * cellSize + dy) * width + (x * cellSize + dx));
                        data[index] = color;     // Red
                        data[index + 1] = color; // Green
                        data[index + 2] = color; // Blue
                        data[index + 3] = 255;   // Alpha
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw pattern preview
        if (mouseOverCanvas && !isMouseDown && patternSelect.value !== 'none' && currentPatternTransformed) {
            drawPatternPreview();
        }
    }

    function getNextGeneration() {
        const newGrid = new Array(rows).fill(null).map(() => new Array(cols).fill(0));

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const neighbors = countNeighbors(grid, x, y);
                if (grid[y][x] === 1) {
                    if (neighbors < 2 || neighbors > 3) {
                        newGrid[y][x] = 0; // Cell dies
                    } else {
                        newGrid[y][x] = 1; // Cell lives
                    }
                } else {
                    if (neighbors === 3) {
                        newGrid[y][x] = 1; // Cell becomes alive
                    }
                }
            }
        }

        grid = newGrid;
    }

    function countNeighbors(grid, x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Skip the cell itself
                const newX = (x + dx + cols) % cols;
                const newY = (y + dy + rows) % rows;
                count += grid[newY][newX];
            }
        }
        return count;
    }

    function eraseCells(event) {
        updateMousePosition(event);
        const col = mouseCol;
        const row = mouseRow;
        for (let dy = -Math.floor(toolSize / 2); dy < Math.ceil(toolSize / 2); dy++) {
            for (let dx = -Math.floor(toolSize / 2); dx < Math.ceil(toolSize / 2); dx++) {
                const c = col + dx;
                const r = row + dy;
                if (c >= 0 && c < cols && r >= 0 && r < rows) {
                    grid[r][c] = 0; // Set the cell to 0 (white)
                }
            }
        }
        drawGrid();
    }

    function addCells(event) {
        updateMousePosition(event);
        const col = mouseCol;
        const row = mouseRow;

        const selectedPattern = patternSelect.value;
        if (selectedPattern !== 'none' && currentPatternTransformed) {
            placePattern(currentPatternTransformed, col, row);
            // Generate a new transformation for next placement
            currentPatternTransformed = transformPattern(patterns[selectedPattern]);
        } else {
            for (let dy = -Math.floor(toolSize / 2); dy < Math.ceil(toolSize / 2); dy++) {
                for (let dx = -Math.floor(toolSize / 2); dx < Math.ceil(toolSize / 2); dx++) {
                    const c = col + dx;
                    const r = row + dy;
                    if (c >= 0 && c < cols && r >= 0 && r < rows) {
                        grid[r][c] = 1; // Set the cell to 1 (black)
                    }
                }
            }
            drawGrid();
        }
    }

    function placePattern(pattern, col, row) {
        const patternHeight = pattern.length;
        const patternWidth = pattern[0].length;
        for (let y = 0; y < patternHeight; y++) {
            for (let x = 0; x < patternWidth; x++) {
                const c = col + x - Math.floor(patternWidth / 2);
                const r = row + y - Math.floor(patternHeight / 2);
                if (c >= 0 && c < cols && r >= 0 && r < rows) {
                    grid[r][c] = pattern[y][x];
                }
            }
        }
        drawGrid();
    }

    function transformPattern(pattern) {
        // Randomly decide how many times to rotate (0 to 3 times)
        const rotations = Math.floor(Math.random() * 4);

        // Randomly decide whether to reflect horizontally
        const reflect = Math.random() < 0.5;

        let transformedPattern = pattern.map(row => row.slice());

        // Rotate the pattern
        for (let i = 0; i < rotations; i++) {
            transformedPattern = rotatePattern(transformedPattern);
        }

        // Reflect the pattern if needed
        if (reflect) {
            transformedPattern = reflectPattern(transformedPattern);
        }

        return transformedPattern;
    }

    function rotatePattern(pattern) {
        const numRows = pattern.length;
        const numCols = pattern[0].length;
        const rotatedPattern = [];

        for (let x = 0; x < numCols; x++) {
            const newRow = [];
            for (let y = numRows - 1; y >= 0; y--) {
                newRow.push(pattern[y][x]);
            }
            rotatedPattern.push(newRow);
        }

        return rotatedPattern;
    }

    function reflectPattern(pattern) {
        return pattern.map(row => row.slice().reverse());
    }

    function drawPatternPreview() {
        const pattern = currentPatternTransformed;
        const patternHeight = pattern.length;
        const patternWidth = pattern[0].length;

        ctx.save();
        ctx.globalAlpha = 0.5;

        for (let y = 0; y < patternHeight; y++) {
            for (let x = 0; x < patternWidth; x++) {
                const c = mouseCol + x - Math.floor(patternWidth / 2);
                const r = mouseRow + y - Math.floor(patternHeight / 2);
                if (c >= 0 && c < cols && r >= 0 && r < rows) {
                    if (pattern[y][x]) {
                        ctx.fillStyle = 'green';
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    }
                }
            }
        }

        ctx.restore();
    }

    function updateMousePosition(event) {
        const rect = canvas.getBoundingClientRect();
        mouseX = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
        mouseY = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;
        mouseCol = Math.floor(mouseX / cellSize);
        mouseRow = Math.floor(mouseY / cellSize);
    }

    function setCursor(mode) {
        const cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = toolSize * cellSize;
        cursorCanvas.height = toolSize * cellSize;
        const cursorCtx = cursorCanvas.getContext('2d');

        cursorCtx.fillStyle = mode === 'add' ? 'white' : 'black';
        cursorCtx.fillRect(0, 0, cursorCanvas.width, cursorCanvas.height);
        
        cursorCtx.strokeStyle = mode === 'add' ? 'black' : 'white';
        cursorCtx.lineWidth = 2;
        cursorCtx.strokeRect(0, 0, cursorCanvas.width, cursorCanvas.height);

        const cursorDataUrl = cursorCanvas.toDataURL();
        canvas.style.cursor = `url(${cursorDataUrl}) ${toolSize / 2 * cellSize} ${toolSize / 2 * cellSize}, auto`;
    }

    function onMouseDown(event) {
        isMouseDown = true;
        if (event.button === 2 || (event.touches && event.touches.length > 1)) { // Right mouse button or touch
            eraseCells(event);
            canvas.addEventListener('mousemove', eraseCells);
            canvas.addEventListener('touchmove', eraseCells);
            setCursor('erase');
        } else if (event.button === 0 || (event.touches && event.touches.length === 1)) { // Left mouse button or touch
            addCells(event);
            canvas.addEventListener('mousemove', addCells);
            canvas.addEventListener('touchmove', addCells);
            setCursor('add');
        }
    }

    function onMouseUp(event) {
        isMouseDown = false;
        if (event.button === 2 || (event.touches && event.touches.length > 1)) { // Right mouse button or touch
            canvas.removeEventListener('mousemove', eraseCells);
            canvas.removeEventListener('touchmove', eraseCells);
        } else if (event.button === 0 || (event.touches && event.touches.length === 1)) { // Left mouse button or touch
            canvas.removeEventListener('mousemove', addCells);
            canvas.removeEventListener('touchmove', addCells);
        }
        canvas.style.cursor = 'default';
    }

    function onMouseMove(event) {
        updateMousePosition(event);
        drawGrid();
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseenter', function() {
        mouseOverCanvas = true;
        // Generate a new transformation when mouse enters canvas
        const selectedPattern = patternSelect.value;
        if (selectedPattern !== 'none' && patterns[selectedPattern]) {
            currentPatternTransformed = transformPattern(patterns[selectedPattern]);
        }
    });
    canvas.addEventListener('mouseleave', function(event) {
        mouseOverCanvas = false;
        isMouseDown = false;
        canvas.removeEventListener('mousemove', eraseCells);
        canvas.removeEventListener('mousemove', addCells);
        canvas.removeEventListener('touchmove', eraseCells);
        canvas.removeEventListener('touchmove', addCells);
        canvas.style.cursor = 'default';
        drawGrid();
    });
    canvas.addEventListener('touchstart', onMouseDown);
    canvas.addEventListener('touchend', onMouseUp);
    canvas.addEventListener('touchcancel', onMouseUp);
    canvas.addEventListener('touchmove', onMouseMove);

    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    // Event listeners for controls
    startPauseButton.addEventListener('click', function() {
        isPaused = !isPaused;
        startPauseButton.textContent = isPaused ? 'Start' : 'Pause';
    });

    resetButton.addEventListener('click', function() {
        initializeGrid();
        drawGrid();
    });

    speedSlider.addEventListener('input', function() {
        frameRate = parseInt(speedSlider.value);
        frameDuration = 1000 / frameRate;
    });

    patternSelect.addEventListener('change', function() {
        const selectedPattern = patternSelect.value;
        if (selectedPattern !== 'none' && patterns[selectedPattern]) {
            currentPatternTransformed = transformPattern(patterns[selectedPattern]);
        } else {
            currentPatternTransformed = null;
        }
    });

    function animate(timestamp) {
        if (!isPaused) {
            if (timestamp - lastFrameTime >= frameDuration) {
                lastFrameTime = timestamp;
                getNextGeneration();
                drawGrid();
            }
        } else {
            drawGrid(); // Still need to draw the grid for the preview
        }
        requestAnimationFrame(animate);
    }

    initializeGrid();
    drawGrid();
    requestAnimationFrame(animate);
});
