export function htmlToPlainPreview(html: string | null | undefined, maxLength = 140): string {
    if (!html) {
        return '';
    }
    const plain = html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!plain) {
        return '';
    }
    return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain;
}

export function looksLikeOidBody(value: string | null | undefined): boolean {
    return !!value && /^\d{4,8}$/.test(value.trim());
}
