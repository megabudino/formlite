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

function logDevEmail(to: string, subject: string, body: string, replyTo?: string): void {
	const bodyPreview = body.length > 200 ? body.substring(0, 200) + '...' : body;
	console.log('[DEV] Email would be sent:');
	console.log(`  To: ${to}`);
	console.log(`  Subject: ${subject}`);
	if (replyTo) {
		console.log(`  Reply-To: ${replyTo}`);
	}
	console.log(`  Body: ${bodyPreview}`);
}

async function sendToSingleRecipient(
	to: string,
	subject: string,
	body: string,
	replyTo?: string
): Promise<SendEmailResult> {
	const mailgunConfig = getMailgunConfig();
	if (!mailgunConfig) {
		if (isDevelopment()) {
			logDevEmail(to, subject, body, replyTo);
			return { success: true };
		}
		return { success: false, error: 'Email not configured' };
	}

	const formData = new FormData();
	formData.append('from', mailgunConfig.fromEmail);
	formData.append('to', to);
	formData.append('subject', subject);
	formData.append('text', body);
	if (replyTo) {
		formData.append('h:Reply-To', replyTo);
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

export async function sendSubmissionEmail(
	to: string[],
	formName: string,
	submissionData: Record<string, unknown>,
	replyTo?: string
): Promise<MultiRecipientResult[]> {
	if (!emailEnabled() && !isDevelopment()) {
		return to.map((email) => ({ email, success: false, error: 'Email not configured' }));
	}

	const subject = `New submission from ${formName}`;
	const body = formatEmailBody(formName, submissionData);

	const results: MultiRecipientResult[] = [];

	for (const email of to) {
		const result = await sendToSingleRecipient(email, subject, body, replyTo);
		results.push({ email, ...result });
		
		if (result.success) {
			console.log(`[Email] Successfully sent to ${email} for form "${formName}"`);
		} else {
			console.error(`[Email] Failed to send to ${email} for form "${formName}": ${result.error}`);
		}
	}

	return results;
}

function formatEmailBody(formName: string, data: Record<string, unknown>): string {
	const timestamp = new Date().toISOString();
	let body = `You received a new submission from ${formName}\n\n`;
	body += `Submitted at: ${timestamp}\n\n`;
	body += '---\n\n';

	for (const [key, value] of Object.entries(data)) {
		const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
		body += `${key}: ${displayValue}\n`;
	}

	return body;
}
