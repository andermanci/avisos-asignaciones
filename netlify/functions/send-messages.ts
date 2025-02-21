import { checkAndSendMessages } from "src/utils/scheduler";

export async function handler(event: any) {
    try {
        console.log('Ejecutando cron job desde Netlify Function...');
        await checkAndSendMessages();
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };
    } catch (error: any) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error?.message ?? 'Ha ocurrido un error' }),
        };
    }
}
