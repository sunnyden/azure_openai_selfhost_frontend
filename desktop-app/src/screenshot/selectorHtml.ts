/**
 * Returns a lightweight HTML shell for a single-display screenshot overlay.
 * Screenshot data is sent via IPC after load to avoid data URL size limits.
 * Each overlay covers exactly one display at its native DPI.
 */
export function getSelectorHtml(width: number, height: number): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%; height: 100%; overflow: hidden;
    cursor: crosshair; user-select: none; background: #000;
  }
  #bgCanvas {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  }
  #overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.35);
  }
  #selection {
    position: fixed; border: 2px solid #fff;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
    display: none; pointer-events: none; z-index: 10;
  }
  #hint {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
    color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px; background: rgba(0,0,0,0.6); padding: 8px 16px;
    border-radius: 6px; z-index: 20; pointer-events: none;
  }
  #dimensions {
    position: fixed; color: #fff; font-family: monospace;
    font-size: 12px; background: rgba(0,0,0,0.7); padding: 2px 6px;
    border-radius: 3px; z-index: 20; pointer-events: none; display: none;
  }
</style>
</head>
<body>
<canvas id="bgCanvas"></canvas>
<div id="overlay"></div>
<div id="selection"></div>
<div id="hint">Click and drag to select a region. Press Escape to cancel.</div>
<div id="dimensions"></div>
<script>
(function() {
  var bgCanvas = document.getElementById('bgCanvas');
  var ctx = bgCanvas.getContext('2d');
  var scaleFactor = 1;

  // Receive this display's screenshot from the main process
  window.screenshotAPI.onDisplayData(function(data) {
    scaleFactor = data.scaleFactor || 1;
    // Set canvas backing resolution to native pixels for crisp rendering
    bgCanvas.width  = Math.round(data.width * scaleFactor);
    bgCanvas.height = Math.round(data.height * scaleFactor);

    var img = new Image();
    img.onload = function() {
      ctx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
    };
    img.src = data.base64;
  });

  // --- Selection logic ---
  var selection = document.getElementById('selection');
  var overlay   = document.getElementById('overlay');
  var hint      = document.getElementById('hint');
  var dims      = document.getElementById('dimensions');
  var dragging = false;
  var startX = 0, startY = 0;

  document.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.display = 'block';
    selection.style.left = startX + 'px';
    selection.style.top  = startY + 'px';
    selection.style.width  = '0px';
    selection.style.height = '0px';
    overlay.style.background = 'transparent';
    hint.style.display = 'none';
  });

  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var x = Math.min(e.clientX, startX);
    var y = Math.min(e.clientY, startY);
    var w = Math.abs(e.clientX - startX);
    var h = Math.abs(e.clientY - startY);
    selection.style.left   = x + 'px';
    selection.style.top    = y + 'px';
    selection.style.width  = w + 'px';
    selection.style.height = h + 'px';
    dims.style.display = 'block';
    dims.style.left = (x + w + 8) + 'px';
    dims.style.top  = (y + h + 8) + 'px';
    dims.textContent = w + ' x ' + h;
  });

  document.addEventListener('mouseup', function(e) {
    if (!dragging) return;
    dragging = false;
    var x = Math.min(e.clientX, startX);
    var y = Math.min(e.clientY, startY);
    var w = Math.abs(e.clientX - startX);
    var h = Math.abs(e.clientY - startY);
    if (w < 5 || h < 5) {
      selection.style.display = 'none';
      overlay.style.background = 'rgba(0, 0, 0, 0.35)';
      hint.style.display = 'block';
      dims.style.display = 'none';
      return;
    }
    // Crop from the backing canvas using the display's scale factor
    var sx = Math.round(x * scaleFactor);
    var sy = Math.round(y * scaleFactor);
    var sw = Math.round(w * scaleFactor);
    var sh = Math.round(h * scaleFactor);
    var cropCanvas = document.createElement('canvas');
    cropCanvas.width  = sw;
    cropCanvas.height = sh;
    var cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(bgCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    var dataUrl = cropCanvas.toDataURL('image/png');
    window.screenshotAPI.selectRegion(dataUrl);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      window.screenshotAPI.cancel();
    }
  });
})();
</script>
</body>
</html>`;
}
