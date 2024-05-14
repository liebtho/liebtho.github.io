document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const cellSize = 4; // size of each cell in pixels
    const toolSize = 4; // size of the eraser and adder
    const width = canvas.width;
    const height = canvas.height;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);
    const frameRate = 10; // target frame rate in frames per second
    const frameDuration = 1000 / frameRate;
    let lastFrameTime = 0;

    let grid = new Array(rows).fill(null).map(() => new Array(cols).fill(0));

    function initializeGrid() {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (x % y == 0 || y % x == 0)
                    grid[y][x] = Math.random() < 0.5 ? 1 : 0; // Randomly set each cell to 1 (black) or 0 (white)
                else 
                    grid[y][x] = 0;
            }
        }
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
    }

    function getNextGeneration() {
        const newGrid = new Array(rows).fill(null).map(() => new Array(cols).fill(0));

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const neighbors = countNeighbors(grid, x, y);
                if (grid[y][x] === 1) {
                    // Apply Conway's Game of Life rules
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
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        for (let dy = -Math.floor(toolSize / 2); dy < Math.ceil(toolSize / 2); dy++) {
            for (let dx = -Math.floor(toolSize / 2); dx < Math.ceil(toolSize / 2); dx++) {
                const c = col + dx;
                const r = row + dy;
                if (c >= 0 && c < cols && r >= 0 && r < rows) {
                    grid[r][c] = 0; // Set the cell to 0 (white)
                }
            }
        }
    }

    function addCells(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        for (let dy = -Math.floor(toolSize / 2); dy < Math.ceil(toolSize / 2); dy++) {
            for (let dx = -Math.floor(toolSize / 2); dx < Math.ceil(toolSize / 2); dx++) {
                const c = col + dx;
                const r = row + dy;
                if (c >= 0 && c < cols && r >= 0 && r < rows) {
                    grid[r][c] = 1; // Set the cell to 1 (black)
                }
            }
        }
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
        if (event.button === 2) { // Right mouse button
            eraseCells(event);
            canvas.addEventListener('mousemove', eraseCells);
            setCursor('erase');
        } else if (event.button === 0) { // Left mouse button
            addCells(event);
            canvas.addEventListener('mousemove', addCells);
            setCursor('add');
        }
    }

    function onMouseUp(event) {
        if (event.button === 2) { // Right mouse button
            canvas.removeEventListener('mousemove', eraseCells);
        } else if (event.button === 0) { // Left mouse button
            canvas.removeEventListener('mousemove', addCells);
        }
        canvas.style.cursor = 'default';
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', function(event) {
        canvas.removeEventListener('mousemove', eraseCells);
        canvas.removeEventListener('mousemove', addCells);
        canvas.style.cursor = 'default';
    });

    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    function animate(timestamp) {
        if (timestamp - lastFrameTime < frameDuration) {
            requestAnimationFrame(animate);
            return;
        }
        lastFrameTime = timestamp;

        getNextGeneration();
        drawGrid();

        requestAnimationFrame(animate);
    }

    initializeGrid();
    drawGrid();
    requestAnimationFrame(animate);
});
