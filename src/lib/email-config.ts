import { env } from '$env/dynamic/private';

export interface MailgunConfig {
	apiKey: string;
	domain: string;
	fromEmail: string;
}

export function isDevelopment(): boolean {
	return env.NODE_ENV !== 'production';
}

let _mailgunConfig: MailgunConfig | null | undefined = undefined;

export function getMailgunConfig(): MailgunConfig | null {
	if (_mailgunConfig !== undefined) {
		return _mailgunConfig;
	}

	const apiKey = env.MAILGUN_API_KEY;
	const domain = env.MAILGUN_DOMAIN;
	const fromEmail = env.MAILGUN_FROM_EMAIL;

	if (!apiKey || !domain || !fromEmail) {
		if (!isDevelopment()) {
			throw new Error(
				'Missing required Mailgun environment variables: MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL'
			);
		}
		_mailgunConfig = null;
		return null;
	}

	_mailgunConfig = { apiKey, domain, fromEmail };
	return _mailgunConfig;
}

export function emailEnabled(): boolean {
	return getMailgunConfig() !== null;
}
