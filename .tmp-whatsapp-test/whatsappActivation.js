"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWhatsAppActivationPayload = buildWhatsAppActivationPayload;
exports.normalizeWhatsAppActivationResponse = normalizeWhatsAppActivationResponse;
exports.getWhatsAppActivationErrorMessage = getWhatsAppActivationErrorMessage;
exports.activateWhatsAppFromApp = activateWhatsAppFromApp;
const api_1 = require("./api");
function buildWhatsAppActivationPayload({ uid, phone }) {
    return {
        uid: uid ?? undefined,
        numero: phone.replace(/\D/g, ''),
    };
}
function normalizeWhatsAppActivationResponse(response) {
    return {
        status: response.status ?? 'unknown',
        numero: response.numero ?? '',
        lid: response.lid ?? null,
        uid: response.uid ?? null,
        whatsappActive: response.whatsapp_active === true,
    };
}
function getWhatsAppActivationErrorMessage(error) {
    const maybeError = error;
    if (maybeError?.response?.status === 404) {
        return 'Numero nao encontrado no WhatsApp.';
    }
    if (maybeError?.code === 'ECONNABORTED') {
        return 'Servidor demorou para validar o WhatsApp.';
    }
    return 'Nao foi possivel ativar o WhatsApp agora.';
}
async function activateWhatsAppFromApp(input) {
    const response = await api_1.api.post('/api/usuario/ativar-whatsapp', buildWhatsAppActivationPayload(input));
    return normalizeWhatsAppActivationResponse(response.data);
}
