export const APP_TIME_ZONE = 'Asia/Hong_Kong';
export const APP_TIME_ZONE_LABEL = 'Hong Kong Time (HKT, UTC+8)';

/** Parse API datetime strings as Hong Kong wall-clock time. */
export function parseHongKongDateTime(value: string): Date {
    const trimmed = value.trim();
    if (!trimmed) {
        return new Date(Number.NaN);
    }
    if (trimmed.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
        return new Date(trimmed);
    }
    const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed.slice(0, 19);
    return new Date(`${normalized}+08:00`);
}

export function formatHongKongDateTime(value: string | null): string {
    if (!value) {
        return '—';
    }
    const date = parseHongKongDateTime(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat('en-HK', {
        timeZone: APP_TIME_ZONE,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'shortOffset',
    }).format(date);
}

/** Value for `<input type="datetime-local">` using Hong Kong wall-clock digits. */
export function toHongKongDatetimeLocalValue(value: string | null): string {
    if (!value) {
        return '';
    }
    const date = parseHongKongDateTime(value);
    if (Number.isNaN(date.getTime())) {
        return value.slice(0, 16);
    }
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: APP_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** Send scheduled time to the API as Hong Kong wall-clock time (no UTC conversion). */
export function toHongKongApiDateTime(value: string): string {
    return value.length === 16 ? `${value}:00` : value.slice(0, 19);
}
