import { defineMiddleware } from "astro/middleware";
import { checkAndSendMessages } from "src/utils/scheduler";

export default defineMiddleware(async () => {
    await checkAndSendMessages();
    return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
    });
});
