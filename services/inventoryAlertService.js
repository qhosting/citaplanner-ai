import nodemailer from 'nodemailer';
import axios from 'axios';

// Instanciar transporter con variables reales de SMTP
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, 
    auth: {
        user: process.env.SMTP_USER || 'demo@aurum.ai',
        pass: process.env.SMTP_PASS || 'demo123'
    }
});

/**
 * Evalúa si un producto cruzó el umbral mínimo de inventario y despacha
 * notificaciones formalizadas de compra directas a su proveedor (Email + WhatsApp WAHA).
 * 
 * @param {Object} product Datos del producto afectado.
 * @param {String} tenantName Nombre comercial del tenant/negocio.
 * @returns {Promise<Object>} Estado del despacho.
 */
export const checkAndAlertInventoryThreshold = async (product, tenantName) => {
    try {
        if (!product || product.stock === null || product.minStock === null) {
            return { triggered: false, reason: "Valores de stock nulos" };
        }

        // Evaluar umbral
        if (product.stock > product.minStock) {
            return { triggered: false, reason: "Stock superior al mínimo" };
        }

        const supplierName = product.supplierName || "Distribuidor";
        const supplierEmail = product.supplierEmail;
        const supplierPhone = product.supplierPhone;

        if (!supplierEmail && !supplierPhone) {
            return { triggered: false, reason: "No hay canales de comunicación para el proveedor" };
        }

        console.log(`⚠️ [INVENTARIO CRÍTICO] Producto: ${product.name} (Stock: ${product.stock} / Mínimo: ${product.minStock})`);

        let emailSent = false;
        let whatsappSent = false;

        const subject = `🚨 Orden de Compra Automática - Reabastecimiento Crítico [${tenantName}]`;
        const htmlContent = `
            <div style="font-family: sans-serif; border: 1px solid #e0e0e0; padding: 20px; max-width: 600px; border-radius: 8px;">
                <h2 style="color: #d32f2f;">Reabastecimiento de Inventario Solicitado</h2>
                <p>Estimado/a <strong>${supplierName}</strong>,</p>
                <p>El stock de la sucursal de <strong>${tenantName}</strong> ha caído por debajo de su umbral crítico y requiere reabastecimiento inmediato:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr style="background-color: #f5f5f5;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Detalle</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Valor</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Producto</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${product.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>SKU</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${product.sku || "N/A"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Categoría</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${product.category || "N/A"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; color: #d32f2f;"><strong>Stock Actual</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #d32f2f;">${product.stock} unidades</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Umbral Mínimo</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${product.minStock} unidades</td>
                    </tr>
                </table>
                <p style="margin-top: 20px;">Por favor, proceda a preparar el pedido correspondiente a esta sucursal a la brevedad.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #888; text-align: center;">Este es un mensaje transaccional automatizado y verídico expedido por el motor CitaPlanner AI.</p>
            </div>
        `;

        // 1. Envío por Correo Electrónico (SMTP)
        if (supplierEmail) {
            try {
                await emailTransporter.sendMail({
                    from: process.env.SMTP_FROM || '"CitaPlanner AI" <no-reply@aurum.ai>',
                    to: supplierEmail,
                    subject,
                    html: htmlContent
                });
                emailSent = true;
                console.log(`✉️ Correo de reabastecimiento enviado a: ${supplierEmail}`);
            } catch (mailError) {
                console.error("❌ Fallo de envío SMTP:", mailError.message);
            }
        }

        // 2. Envío por WhatsApp WAHA
        const wahaBaseUrl = process.env.WAHA_API_URL || process.env.WAHA_URL;
        if (supplierPhone && wahaBaseUrl) {
            try {
                const messageText = `*🚨 ORDEN DE COMPRA AUTOMÁTICA [${tenantName}]*\n\nEstimado/a *${supplierName}*,\n\nEl stock de *${product.name}* en nuestro salón ha alcanzado su límite mínimo.\n\n*Detalles del Inventario:*\n- Producto: ${product.name}\n- SKU: ${product.sku || "N/A"}\n- Stock Actual: *${product.stock}* unidades\n- Umbral Crítico: ${product.minStock} unidades\n\nPor favor, prepare una orden de entrega para reabastecer a la brevedad.`;
                
                await axios.post(`${wahaBaseUrl}/api/sendText`, {
                    chatId: `${supplierPhone}@c.us`,
                    text: messageText,
                    session: process.env.WAHA_SESSION || 'default'
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });
                whatsappSent = true;
                console.log(`💬 WhatsApp de reabastecimiento enviado a: ${supplierPhone}`);
            } catch (wahaError) {
                console.error("❌ Fallo de envío WAHA:", wahaError.message);
            }
        }

        return { triggered: true, emailSent, whatsappSent };
    } catch (e) {
        console.error("❌ [INVENTORY ALERT ERROR]:", e.message);
        return { triggered: false, error: e.message };
    }
};
