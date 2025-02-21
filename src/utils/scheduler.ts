import { db, eq, lte, Messages } from 'astro:db';
import { config } from "dotenv";
import twilio from 'twilio';

config({ path: "../../.env" });

// Configuración de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function checkAndSendMessages() {
    const now = new Date();
    const result = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
    };

    try {
        // Obtener mensajes pendientes usando Astro DB (Drizzle ORM)
        const pendingMessages = await db
            .select()
            .from(Messages)
            .where(lte(Messages.sendAt, now) && eq(Messages.status, 'pending'))
            .all();

        // Si no hay mensajes pendientes
        if (pendingMessages.length === 0) {
            return {
                ...result,
                message: 'No hay mensajes pendientes.',
            };
        }

        for (const message of pendingMessages) {
            try {
                // Enviar mensaje por WhatsApp usando Twilio
                const response = await client.messages.create({
                    body: message.message,
                    to: `whatsapp:+34${message.telefono}`,
                    from: "whatsapp:+14155238886",
                });

                // Marcar mensaje como 'sent' en la base de datos
                await db
                    .update(Messages)
                    .set({ status: 'sent' })
                    .where(eq(Messages.id, message.id))
                    .execute();
                
                console.log(`✅ Mensaje enviado a ${message.telefono}: ${response.sid}`);
                result.sent++; // Incrementar mensajes enviados
            } catch (error: any) {
                // Si falla, marcar como 'failed'
                await db
                    .update(Messages)
                    .set({ status: 'failed' })
                    .where(eq(Messages.id, message.id))
                    .execute();
                
                console.error(`❌ Error enviando a ${message.telefono}:`, error);
                result.failed++; // Incrementar mensajes fallidos
                result.errors.push(`Error enviando a ${message.telefono}: ${error.message}`); // Guardar error específico
            }
        }

        return {
            ...result,
            message: `Se han enviado ${result.sent} mensajes y ${result.failed} fallaron.`,
        };
    } catch (error: any) {
        console.error("Error general en el proceso:", error);
        return {
            ...result,
            message: 'Ha ocurrido un error al intentar enviar los mensajes.',
            error: error.message,
        };
    }
}
