import { createHmac } from 'crypto';

export interface Webhook {
	id: string;
	form_id: string;
	url: string;
	secret: string;
}

export interface WebhookPayload {
	event: 'submission';
	form_id: string;
	submission_id: number;
	data: Record<string, unknown>;
	meta: Record<string, unknown>;
	created_at: string;
}

export interface WebhookResult {
	webhookId: string;
	url: string;
	success: boolean;
	statusCode?: number;
	error?: string;
}

function computeSignature(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(payload).digest('hex');
}

async function sendWebhook(
	webhook: Webhook,
	payload: WebhookPayload
): Promise<WebhookResult> {
	const payloadString = JSON.stringify(payload);
	const signature = computeSignature(payloadString, webhook.secret);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	try {
		const response = await fetch(webhook.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Freeform-Signature': signature
			},
			body: payloadString,
			signal: controller.signal,
			redirect: 'follow'
		});

		clearTimeout(timeoutId);

		if (response.ok) {
			console.log(`[Webhook] Successfully dispatched to ${webhook.url} (${response.status})`);
			return {
				webhookId: webhook.id,
				url: webhook.url,
				success: true,
				statusCode: response.status
			};
		} else {
			console.error(`[Webhook] Failed to dispatch to ${webhook.url}: ${response.status}`);
			return {
				webhookId: webhook.id,
				url: webhook.url,
				success: false,
				statusCode: response.status,
				error: `HTTP ${response.status}`
			};
		}
	} catch (err) {
		clearTimeout(timeoutId);

		let errorMessage: string;
		if (err instanceof Error) {
			if (err.name === 'AbortError') {
				errorMessage = 'Request timeout (10s)';
			} else {
				errorMessage = err.message;
			}
		} else {
			errorMessage = 'Unknown error';
		}

		console.error(`[Webhook] Failed to dispatch to ${webhook.url}: ${errorMessage}`);
		return {
			webhookId: webhook.id,
			url: webhook.url,
			success: false,
			error: errorMessage
		};
	}
}

export async function dispatchWebhooks(
	webhooks: Webhook[],
	submissionData: {
		form_id: string;
		submission_id: number;
		data: Record<string, unknown>;
		meta: Record<string, unknown>;
		created_at: string;
	}
): Promise<WebhookResult[]> {
	if (webhooks.length === 0) {
		return [];
	}

	const payload: WebhookPayload = {
		event: 'submission',
		form_id: submissionData.form_id,
		submission_id: submissionData.submission_id,
		data: submissionData.data,
		meta: submissionData.meta,
		created_at: submissionData.created_at
	};

	const results = await Promise.all(
		webhooks.map((webhook) => sendWebhook(webhook, payload))
	);

	const successCount = results.filter((r) => r.success).length;
	const failCount = results.length - successCount;
	console.log(`[Webhook] Dispatched to ${results.length} webhooks: ${successCount} succeeded, ${failCount} failed`);

	return results;
}
