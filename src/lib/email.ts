import { getMailgunConfig, emailEnabled, isDevelopment } from './email-config';

export interface SendEmailResult {
	success: boolean;
	error?: string;
}

export interface MultiRecipientResult {
	email: string;
	success: boolean;
	error?: string;
}

export interface EmailMessage {
	subject: string;
	text: string;
	html?: string;
	replyTo?: string;
	// Shown as the sender's name. The address always stays MAILGUN_FROM_EMAIL.
	fromName?: string;
}

// MAILGUN_FROM_EMAIL can be a bare address or already "Name <address>".
export function buildFromHeader(fromEmail: string, fromName?: string): string {
	const name = fromName?.replace(/["<>\\\r\n]/g, '').trim();
	if (!name) return fromEmail;
	const address = fromEmail.match(/<([^>]+)>/)?.[1] ?? fromEmail.trim();
	return `"${name}" <${address}>`;
}

function logDevEmail(to: string, message: EmailMessage): void {
	const bodyPreview = message.text.length > 200 ? message.text.substring(0, 200) + '...' : message.text;
	console.log('[DEV] Email would be sent:');
	console.log(`  To: ${to}`);
	if (message.fromName) {
		console.log(`  From name: ${message.fromName}`);
	}
	console.log(`  Subject: ${message.subject}`);
	if (message.replyTo) {
		console.log(`  Reply-To: ${message.replyTo}`);
	}
	console.log(`  Body: ${bodyPreview}`);
}

export async function sendEmail(to: string, message: EmailMessage): Promise<SendEmailResult> {
	const mailgunConfig = getMailgunConfig();
	if (!mailgunConfig) {
		if (isDevelopment()) {
			logDevEmail(to, message);
			return { success: true };
		}
		return { success: false, error: 'Email not configured' };
	}

	const formData = new FormData();
	formData.append('from', buildFromHeader(mailgunConfig.fromEmail, message.fromName));
	formData.append('to', to);
	formData.append('subject', message.subject);
	formData.append('text', message.text);
	if (message.html) {
		formData.append('html', message.html);
	}
	if (message.replyTo) {
		formData.append('h:Reply-To', message.replyTo);
	}

	const baseUrl = mailgunConfig.region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
	const url = `${baseUrl}/v3/${mailgunConfig.domain}/messages`;
	const auth = Buffer.from(`api:${mailgunConfig.apiKey}`).toString('base64');

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${auth}`
			},
			body: formData
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Email] Mailgun API error: ${response.status} - ${errorText}`);
			return { success: false, error: `Mailgun API error: ${response.status}` };
		}

		return { success: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error(`[Email] Failed to send email: ${message}`);
		return { success: false, error: `Failed to send email: ${message}` };
	}
}

export async function sendToRecipients(
	to: string[],
	message: EmailMessage,
	label: string
): Promise<MultiRecipientResult[]> {
	if (!emailEnabled() && !isDevelopment()) {
		return to.map((email) => ({ email, success: false, error: 'Email not configured' }));
	}

	const results: MultiRecipientResult[] = [];

	for (const email of to) {
		const result = await sendEmail(email, message);
		results.push({ email, ...result });

		if (result.success) {
			console.log(`[Email] Successfully sent ${label} to ${email}`);
		} else {
			console.error(`[Email] Failed to send ${label} to ${email}: ${result.error}`);
		}
	}

	return results;
}
