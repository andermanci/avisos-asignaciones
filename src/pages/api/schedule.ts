import type { APIRoute } from 'astro';
import { db, Messages } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
    const { telefono, message, sendAt } = await request.json();

    if (!telefono || !message || !sendAt) {
        return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    await db.insert(Messages).values({ telefono, message, sendAt: new Date(sendAt), status: 'pending' });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}