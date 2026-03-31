import { createHash } from 'crypto';
import { OperationalError, type Logger } from 'n8n-workflow';

let instance: ConnectionPoolManager;

// 5 minutes
const ttl = 5 * 60 * 1000;

// 1 minute
const cleanUpInterval = 60 * 1000;

type RegistrationOptions = {
	credentials: unknown;
	nodeType: string;
	nodeVersion?: string;
};

type GetConnectionOption<Pool> = RegistrationOptions & {
	fallBackHandler: (abortController: AbortController) => Promise<Pool>;
	wasUsed: (pool: Pool) => void;
};

type Registration<Pool> = {
	pool: Pool;
	abortController: AbortController;
	wasUsed: (pool: Pool) => void;
	lastUsed: number;
};

export class ConnectionPoolManager {
	static getInstance(logger: Logger): ConnectionPoolManager {
		if (!instance) {
			instance = new ConnectionPoolManager(logger);
		}
		return instance;
	}

	private map = new Map<string, Registration<unknown>>();

	private constructor(private readonly logger: Logger) {
		process.on('exit', () => {
			this.logger.debug('ConnectionPoolManager: Shutting down. Cleaning up all pools');
			this.purgeConnections();
		});

		setInterval(() => this.cleanupStaleConnections(), cleanUpInterval);
	}

	private makeKey({ credentials, nodeType, nodeVersion }: RegistrationOptions): string {
		return createHash('sha1')
			.update(
				JSON.stringify({
					credentials,
					nodeType,
					nodeVersion,
				}),
			)
			.digest('base64');
	}

	async getConnection<T>(options: GetConnectionOption<T>): Promise<T> {
		const key = this.makeKey(options);

		let value = this.map.get(key);

		if (value) {
			value.lastUsed = Date.now();
			value.wasUsed(value.pool);
			return value.pool as T;
		}

		const abortController = new AbortController();
		value = {
			pool: await options.fallBackHandler(abortController),
			abortController,
			wasUsed: options.wasUsed,
		} as Registration<unknown>;

		if (abortController.signal.aborted) {
			throw new OperationalError('Could not create pool. Connection attempt was aborted.', {
				cause: abortController.signal.reason,
			});
		}

		this.map.set(key, { ...value, lastUsed: Date.now() });
		abortController.signal.addEventListener('abort', async () => {
			this.logger.debug('ConnectionPoolManager: Got abort signal, cleaning up pool.');
			this.cleanupConnection(key);
		});

		return value.pool as T;
	}

	private cleanupConnection(key: string) {
		const registration = this.map.get(key);

		if (registration) {
			this.map.delete(key);
			registration.abortController.abort();
		}
	}

	private cleanupStaleConnections() {
		const now = Date.now();
		for (const [key, { lastUsed }] of this.map.entries()) {
			if (now - lastUsed > ttl) {
				this.logger.debug('ConnectionPoolManager: Found stale pool. Cleaning it up.');
				void this.cleanupConnection(key);
			}
		}
	}

	purgeConnections(): void {
		for (const key of this.map.keys()) {
			this.cleanupConnection(key);
		}
	}
}
