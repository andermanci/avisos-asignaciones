import type { APIRoute } from 'astro';
import { checkAndSendMessages } from 'src/utils/scheduler';

export const POST: APIRoute = async () => {
    try {
        const result = await checkAndSendMessages();
        
        // Devolver la respuesta con los resultados
        return new Response(JSON.stringify(result), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    } catch (error: any) {
        console.error('Error ejecutando el cron job:', error);
        return new Response(JSON.stringify({ message: 'Ha ocurrido un error', error: error.message }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
};
