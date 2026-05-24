
export function FormatDate(date_string: string) {
    if (!date_string) return "-";

    const date = new Date(date_string);

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}