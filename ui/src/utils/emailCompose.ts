export interface EmailComposeDraft {
    recipients: string[];
    subject: string;
    body: string;
    attachmentPaths?: string[];
}

export function attachmentFileName(path: string): string {
    const base = path.split(/[/\\]/).pop() ?? path;
    const underscoreIndex = base.indexOf('_');
    return underscoreIndex >= 0 ? base.slice(underscoreIndex + 1) : base;
}

export function toComposeDraft(source: {
    recipients?: string[];
    subject?: string;
    body?: string;
    attachmentPaths?: string[];
}): EmailComposeDraft {
    return {
        recipients: source.recipients ?? [],
        subject: source.subject ?? '',
        body: source.body ?? '',
        attachmentPaths: source.attachmentPaths ?? [],
    };
}
