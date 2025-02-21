import type { APIRoute } from "astro";
import { checkAndSendMessages } from "scheduler";

export const POST: APIRoute = async ({ request }) => {
    try {
        checkAndSendMessages();

        return new Response("Se ha mandado bien", { status: 200 });
    } catch (error) {
        return new Response("Ha ocurrido un error", {
            status: 500,
        });
    }
};

