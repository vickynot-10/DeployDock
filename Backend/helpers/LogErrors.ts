import fs from "fs";
import path from "path";

export function LogError(error: unknown): void {
    try {
        const logDir = path.join(process.cwd(), "error_logs");

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const now = new Date();

        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = String(now.getFullYear()).slice(-2);

        const fileName = `error_${day}-${month}-${year}.txt`;

        const filePath = path.join(logDir, fileName);

        const time = now.toLocaleTimeString();

        let errorMessage = "Unknown Error";
        let errorStack = "No Stack";

        if (error instanceof Error) {
            errorMessage = error.message;
            errorStack = error.stack || "No Stack";
        } else if (typeof error === "string") {
            errorMessage = error;
        } else {
            errorMessage = JSON.stringify(error, null, 2);
        }

        const log = `
====================================
Time : ${time}
Date : ${day}-${month}-${year}

Error Message:
${errorMessage}

Stack:
${errorStack}

====================================

`;

        fs.appendFileSync(filePath, log, "utf8");
    } catch (err) {
        console.error("Failed to write error log:", err);
    }
}
