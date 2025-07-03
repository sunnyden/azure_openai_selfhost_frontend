/**
 * Image processing utilities for chat image upload functionality
 */

/**
 * Resize an image to fit within maximum dimensions while maintaining aspect ratio
 * @param file - The image file to resize
 * @param maxWidth - Maximum width (default: 1280)
 * @param maxHeight - Maximum height (default: 1280)
 * @returns Promise<string> - Base64 encoded image data
 */
export function resizeImageToBase64(
    file: File,
    maxWidth: number = 1280,
    maxHeight: number = 1280
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Unable to get canvas context'));
            return;
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;
                
                if (width > height) {
                    width = Math.min(width, maxWidth);
                    height = width / aspectRatio;
                } else {
                    height = Math.min(height, maxHeight);
                    width = height * aspectRatio;
                }
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw and resize the image
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to base64
            try {
                const base64 = canvas.toDataURL(file.type);
                resolve(base64);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Create object URL for the image
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
    });
}

/**
 * Validate if a file is a supported image type
 * @param file - File to validate
 * @returns boolean - True if file is a supported image
 */
export function isValidImageFile(file: File): boolean {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return supportedTypes.includes(file.type);
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns string - Formatted file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}