import { column, defineDb, defineTable } from 'astro:db';

const Messages = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    telefono: column.text(),
    message: column.text(),
    sendAt: column.date(),
    status: column.text({ default: 'pending' }), 
  }
})

// https://astro.build/db/config
export default defineDb({
  tables: {
    Messages
  }
});
