import { api } from './api';

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
  scheduled_at: string;
  recipients: RecipientInput[];
  attachments: AttachmentInput[];
}

export async function createEmail(payload: CreateEmailInput) {
  const { data } = await api.post('/emails', payload);
  return data;
}

export async function updateEmail(id: string, payload: Partial<CreateEmailInput>) {
  const { data } = await api.patch(`/emails/${id}`, payload);
  return data;
}

export async function sendEmailNow(id: string) {
  const { data } = await api.post(`/emails/${id}/send-now`);
  return data;
}

export async function listEmails(status?: string) {
  const { data } = await api.get('/emails', { params: status ? { status } : {} });
  return data;
}

export async function presignAttachment(file: File) {
  const { data } = await api.post('/attachments/presign', {
    filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    size: file.size
  });

  await fetch(data.url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });

  return {
    filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    size: file.size,
    storage_key: data.storage_key as string
  };
}
