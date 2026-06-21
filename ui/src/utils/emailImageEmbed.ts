const MAX_EMBED_WIDTH = 900;
const JPEG_QUALITY = 0.85;

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

/** Resize large photos so embedded base64 stays email-friendly. */
export async function fileToEmbeddedDataUrl(file: File): Promise<string> {
    const dataUrl = await readFileAsDataUrl(file);
    if (!file.type.startsWith('image/')) {
        return dataUrl;
    }

    try {
        const img = await loadImage(dataUrl);
        const scale = Math.min(1, MAX_EMBED_WIDTH / img.width);
        if (scale >= 1) {
            return dataUrl;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return dataUrl;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        return canvas.toDataURL(outputType, JPEG_QUALITY);
    } catch {
        return dataUrl;
    }
}

export function htmlContainsBrokenEmbeddedImages(html: string): boolean {
    return /\bsrc\s*=\s*["']blob:/i.test(html);
}
