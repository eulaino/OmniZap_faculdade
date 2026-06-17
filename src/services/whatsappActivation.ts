import { api } from './api';

type WhatsAppActivationInput = {
  uid?: string | null;
  phone: string;
};

type WhatsAppActivationBackendResponse = {
  status?: string;
  numero?: string;
  lid?: string | null;
  uid?: string | null;
  whatsapp_active?: boolean;
};

export type WhatsAppActivationState = {
  status: string;
  numero: string;
  lid: string | null;
  uid: string | null;
  whatsappActive: boolean;
};

export function buildWhatsAppActivationPayload({ uid, phone }: WhatsAppActivationInput) {
  return {
    uid: uid ?? undefined,
    numero: phone.replace(/\D/g, ''),
  };
}

export function normalizeWhatsAppActivationResponse(
  response: WhatsAppActivationBackendResponse
): WhatsAppActivationState {
  return {
    status: response.status ?? 'unknown',
    numero: response.numero ?? '',
    lid: response.lid ?? null,
    uid: response.uid ?? null,
    whatsappActive: response.whatsapp_active === true,
  };
}

export function getWhatsAppActivationErrorMessage(error: unknown) {
  const maybeError = error as { code?: string; response?: { status?: number } };

  if (maybeError?.response?.status === 404) {
    return 'Numero nao encontrado no WhatsApp.';
  }

  if (maybeError?.code === 'ECONNABORTED') {
    return 'Servidor demorou para validar o WhatsApp.';
  }

  return 'Nao foi possivel ativar o WhatsApp agora.';
}

export async function activateWhatsAppFromApp(input: WhatsAppActivationInput) {
  const response = await api.post(
    '/api/usuario/ativar-whatsapp',
    buildWhatsAppActivationPayload(input)
  );

  return normalizeWhatsAppActivationResponse(response.data);
}
