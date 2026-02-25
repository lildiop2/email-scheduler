import { api } from './api';
import { resolveApiErrorMessage } from '../utils/errorMessages';

export interface RecipientInput {
  type: 'TO' | 'CC' | 'BCC';
  email: string;
}

export interface AttachmentInput {
  filename: string;
  mime_type: string;
  size: number;
  storage_key: string;
}

export interface CreateEmailInput {
  subject: string;
  body_html: string;
  from_alias?: string;
  from_name?: string;
  scheduled_at: string;
  recipients: RecipientInput[];
  attachments: AttachmentInput[];
}

export async function createEmail(payload: CreateEmailInput) {
  try {
    const { data } = await api.post('/emails', payload);
    return data;
  } catch (err) {
    const message = resolveApiErrorMessage(
      err,
      [
        { status: 400, code: 'VALIDATION_ERROR', message: 'Verifique os campos obrigatórios e tente novamente.' },
        { status: 401, message: 'Sessão expirada. Faça login novamente.' },
        { status: 413, message: 'Anexos muito grandes. Reduza o tamanho e tente novamente.' }
      ],
      'Não foi possível agendar o email. Tente novamente em instantes.'
    );
    throw new Error(message);
  }
}

export async function updateEmail(id: string, payload: Partial<CreateEmailInput>) {
  try {
    const { data } = await api.patch(`/emails/${id}`, payload);
    return data;
  } catch (err) {
    const message = resolveApiErrorMessage(
      err,
      [
        { status: 409, code: 'EMAIL_SENT', message: 'Este email não pode ser editado no momento.' },
        { status: 409, code: 'EMAIL_PROCESSING', message: 'Este email não pode ser editado no momento.' },
        { status: 409, code: 'EMAIL_FAILED', message: 'Este email não pode ser editado no momento.' },
        { status: 401, message: 'Sessão expirada. Faça login novamente.' },
        { status: 413, message: 'Anexos muito grandes. Reduza o tamanho e tente novamente.' }
      ],
      'Não foi possível atualizar o email. Tente novamente em instantes.'
    );
    throw new Error(message);
  }
}

export async function sendEmailNow(id: string) {
  try {
    const { data } = await api.post(`/emails/${id}/send-now`);
    return data;
  } catch (err) {
    const message = resolveApiErrorMessage(
      err,
      [
        { status: 409, code: 'EMAIL_SENT', message: 'Este email não pode ser enviado agora.' },
        { status: 409, code: 'EMAIL_PROCESSING', message: 'Este email não pode ser enviado agora.' },
        { status: 409, code: 'EMAIL_FAILED', message: 'Este email não pode ser enviado agora.' },
        { status: 401, message: 'Sessão expirada. Faça login novamente.' }
      ],
      'Falha ao enviar agora.'
    );
    throw new Error(message);
  }
}

export async function listEmails(status?: string) {
  const { data } = await api.get('/emails', { params: status ? { status } : {} });
  return data;
}

export async function presignAttachment(file: File) {
  try {
    const { data } = await api.post('/attachments/presign', {
      filename: file.name,
      mime_type: file.type || 'application/octet-stream',
      size: file.size
    });

    const upload = await fetch(data.url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });

    if (!upload.ok) {
      throw new Error('UPLOAD_FAILED');
    }

    return {
      filename: file.name,
      mime_type: file.type || 'application/octet-stream',
      size: file.size,
      storage_key: data.storage_key as string
    };
  } catch (err) {
    const message = resolveApiErrorMessage(
      err,
      [{ status: 413, message: 'Um ou mais anexos excedem o tamanho permitido.' }],
      'Falha ao enviar anexos. Verifique sua conexão e tente novamente.'
    );
    if (err instanceof Error && err.message === 'UPLOAD_FAILED') {
      throw new Error('Falha ao enviar anexos. Verifique sua conexão e tente novamente.');
    }
    throw new Error(message);
  }
}
