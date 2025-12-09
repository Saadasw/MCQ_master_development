/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID if available, otherwise falls back to crypto.getRandomValues,
 * and finally Math.random for maximum compatibility (e.g. non-secure contexts).
 */
export const generateId = (): string => {
    // 1. Native robust implementation (Secure Contexts)
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    // 2. Hybrid implementation (crypto.getRandomValues)
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    }

    // 3. Fallback (Math.random) - sufficient for this app's scale
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
