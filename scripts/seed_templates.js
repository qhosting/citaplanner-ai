import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Professional Marketing Templates...');

    // Find the first tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('❌ No tenant found. Please run the system first.');
        return;
    }

    const templates = [
        {
            name: 'Feliz Cumpleaños VIP',
            channel: 'WHATSAPP',
            content: '🎈 ¡Feliz Cumpleaños, {{NAME}}! En {{BUSINESS}} queremos celebrar contigo. 🎉 Presenta este mensaje en tu próxima visita y recibe un 15% de descuento en cualquier servicio. ¡Te esperamos! ✨',
            tenantId: tenant.id
        },
        {
            name: 'Recordatorio de Cita (24h)',
            channel: 'WHATSAPP',
            content: '⏰ Hola {{NAME}}, te recordamos tu cita en {{BUSINESS}} para el día {{DATE}}. 🌸 Por favor, confímanos tu asistencia respondiendo a este mensaje. ¡Nos vemos pronto! ✨',
            tenantId: tenant.id
        },
        {
            name: 'Confirmación Inmediata',
            channel: 'WHATSAPP',
            content: '✅ ¡Cita Confirmada! Hola {{NAME}}, tu espacio en {{BUSINESS}} ha sido reservado para el {{DATE}}. 📍 Te esperamos puntualmente. Si necesitas reprogramar, avísanos con 24h de anticipación. ✨',
            tenantId: tenant.id
        },
        {
            name: 'Reactivación (Te Extrañamos)',
            channel: 'WHATSAPP',
            content: '🌸 ¡Te extrañamos, {{NAME}}! Hace tiempo que no nos visitas en {{BUSINESS}}. ✨ Queremos consentirte de nuevo: agenda esta semana y recibe un tratamiento de hidratación cortesía de la casa. 💖 ¡Reserva aquí!',
            tenantId: tenant.id
        },
        {
            name: 'Newsletter: Nueva Temporada',
            channel: 'EMAIL',
            subject: '✨ Descubre lo nuevo que tenemos para ti en {{BUSINESS}}',
            content: 'Hola {{NAME}},\n\nEstamos muy emocionados de presentarte nuestras nuevas tendencias para esta temporada. 🌸 En {{BUSINESS}} nos esforzamos por mantenerte siempre a la vanguardia del estilo.\n\nReserva tu cita hoy mismo y déjate consentir por nuestros expertos.\n\n¡Te esperamos!',
            tenantId: tenant.id
        }
    ];

    for (const t of templates) {
        await prisma.marketingTemplate.create({
            data: t
        });
        console.log(`✅ Template created: ${t.name}`);
    }

    console.log('🚀 Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
