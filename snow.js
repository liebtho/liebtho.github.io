document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawSnow() {
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const color = Math.random() < 0.5 ? 255 : 0; // Random white or black
            imageData.data[i] = color;     // Red
            imageData.data[i + 1] = color; // Green
            imageData.data[i + 2] = color; // Blue
            imageData.data[i + 3] = 255;   // Alpha
        }
        ctx.putImageData(imageData, 0, 0);
        requestAnimationFrame(drawSnow);
    }

    drawSnow();
});
