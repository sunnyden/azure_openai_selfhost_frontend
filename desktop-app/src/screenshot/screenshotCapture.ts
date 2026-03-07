import { desktopCapturer, screen } from "electron";

export interface CaptureRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DisplayCapture {
    /** Base64 data URL of this display's screenshot */
    base64: string;
    /** Display bounds in screen coordinates */
    bounds: CaptureRect;
    scaleFactor: number;
}

export interface VirtualScreenInfo {
    /** Bounding rect of the entire virtual screen (all monitors) in screen coords */
    bounds: CaptureRect;
    /** Per-display captures */
    displays: DisplayCapture[];
}

/**
 * Capture all screens and return their images alongside the virtual screen geometry.
 */
export async function captureAllScreens(): Promise<VirtualScreenInfo> {
    const allDisplays = screen.getAllDisplays();

    // Compute the virtual screen bounding box
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    for (const d of allDisplays) {
        minX = Math.min(minX, d.bounds.x);
        minY = Math.min(minY, d.bounds.y);
        maxX = Math.max(maxX, d.bounds.x + d.bounds.width);
        maxY = Math.max(maxY, d.bounds.y + d.bounds.height);
    }

    // Capture each display individually at its native resolution
    const displays: DisplayCapture[] = [];

    for (const display of allDisplays) {
        const sources = await desktopCapturer.getSources({
            types: ["screen"],
            thumbnailSize: {
                width: Math.round(display.size.width * display.scaleFactor),
                height: Math.round(display.size.height * display.scaleFactor),
            },
        });

        const source =
            sources.find(s => s.display_id === String(display.id)) ||
            sources[0];

        if (!source) continue;

        const pngBase64 = `data:image/png;base64,${source.thumbnail.toPNG().toString("base64")}`;
        displays.push({
            base64: pngBase64,
            bounds: {
                x: display.bounds.x,
                y: display.bounds.y,
                width: display.bounds.width,
                height: display.bounds.height,
            },
            scaleFactor: display.scaleFactor,
        });
    }

    return {
        bounds: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        },
        displays,
    };
}
