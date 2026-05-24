export function isStringEmpty(text: string): boolean {
    if (typeof text !== "string") return true;
    return text.trim().length === 0;
}