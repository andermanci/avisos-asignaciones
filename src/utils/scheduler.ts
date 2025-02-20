const { db, eq, lte, Messages } = await import('astro:db');
import { config } from "dotenv";
import twilio from 'twilio';

config({ path: "../../.env" });

// Configuración de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function checkAndSendMessages() {
    const now = new Date();

    // Obtener mensajes pendientes usando Astro DB (Drizzle ORM)
    const pendingMessages = await db
        .select()
        .from(Messages)
        .where(lte(Messages.sendAt, now) && eq(Messages.status, 'pending'))
        .all();

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
        } catch (error) {
            // Si falla, marcar como 'failed'
            await db
                .update(Messages)
                .set({ status: 'failed' })
                .where(eq(Messages.id, message.id))
                .execute();
            
            console.error(`❌ Error enviando a ${message.telefono}:`, error);
        }
    }
}
