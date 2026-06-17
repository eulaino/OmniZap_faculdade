"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const whatsappActivation_1 = require("./whatsappActivation");
const payload = (0, whatsappActivation_1.buildWhatsAppActivationPayload)({
    uid: 'firebase-user-1',
    phone: '+55 (21) 99999-9999',
});
if (payload.uid !== 'firebase-user-1') {
    throw new Error('Expected Firebase uid to be preserved');
}
if (payload.numero !== '5521999999999') {
    throw new Error(`Expected phone digits only, got ${payload.numero}`);
}
const active = (0, whatsappActivation_1.normalizeWhatsAppActivationResponse)({
    status: 'ok',
    numero: '5521999999999',
    lid: '97749244637198@lid',
    whatsapp_active: true,
});
if (!active.whatsappActive) {
    throw new Error('Expected whatsappActive to map from backend whatsapp_active');
}
if (active.lid !== '97749244637198@lid') {
    throw new Error('Expected lid to be preserved');
}
if ((0, whatsappActivation_1.getWhatsAppActivationErrorMessage)({ response: { status: 404 } }) !== 'Numero nao encontrado no WhatsApp.') {
    throw new Error('Expected friendly message for unknown WhatsApp number');
}
if ((0, whatsappActivation_1.getWhatsAppActivationErrorMessage)({ code: 'ECONNABORTED' }) !== 'Servidor demorou para validar o WhatsApp.') {
    throw new Error('Expected friendly message for timeout');
}
