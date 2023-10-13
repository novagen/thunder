import EventEmitter from 'events';
import { WebSocket, MessageEvent } from 'ws';
import { Config, Strike } from './types';
import { Events } from './events';
import { Heartbeat } from './heartbeat';

const SMHI_URL = 'ws://data-push.smhi.se/api/category/lightning-strike/version/1/country-code/SE/data.json';
const SMHI_TIMEOUT = 35000;
const SMHI_INTERVAL = 1000;

export class Client extends EventEmitter {
    private client: WebSocket | null = null;
    private config: Config;
    private heartbeat: Heartbeat;

    /**
     * Create a new ThunderClient.
     * @param {string} username The username to use for authentication. If not provied the SMHI_USERNAME environment variable will be used.
     * @param {string} password The password to use for authentication. If not provied the SMHI_PASSWORD environment variable will be used.
     * @returns {Client} A new ThunderClient instance.
     */
    public constructor(username: string | undefined = undefined, password: string | undefined = undefined) {
        super();

        this.config = this.createConfig(username, password);
        this.heartbeat = new Heartbeat(SMHI_TIMEOUT, SMHI_INTERVAL, () => {
            this.emit(Events.TIMEOUT);
            this.stop(true);
            this.start(true);
        });
    }

    /**
     * Start the client.
     * @param {boolean} noEmit If true, the client will not emit the STARTED event.
     * @returns {void}
     */
    public start(noEmit = false): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            if (!this.client) {
                this.client = this.createClient(resolve, reject);
            }

            if (this.client) {
                this.client.onmessage = (e): void => this.onMessage(e);
            }

            if (!noEmit) {
                this.emit(Events.STARTED);
            }
        });

        return promise;
    }

    /**
     * Stop the client.
     * @param {boolean} noEmit If true, the client will not emit the STOPPED event.
     * @returns {void}
     */
    public stop(noEmit = false): void {
        if (this.client) {
            this.client.close();
            this.client.onmessage = null;
            this.client = null;
        }

        if (!noEmit) {
            this.emit(Events.STOPPED);
        }
    }

    /**
     * Get the current websocket connection.
     * @returns {WebSocket} The current websocket connection.
     */
    public getWebSocket(): WebSocket | null {
        return this.client;
    }

    private onMessage(m: MessageEvent): void {
        const data: Strike = JSON.parse(m.data as string);

        if (data.countryCode == 'ZZ') {
            this.heartbeat.beat();
            this.emit(Events.HEARTBEAT, this.heartbeat);
            return;
        }

        this.emit(Events.STRIKE, data);
    }

    private createClient(resolve: (value: void | PromiseLike<void>) => void, reject: () => void): WebSocket {
        const client = new WebSocket(this.config.url, 'echo-protocol', {
            headers: {
                'Authorization': this.getAuthorization()
            }
        });

        client.once('open', (): void => {
            resolve();
        });

        client.once('close', (): void => {
            reject();
        });

        client.onopen = (): void => {
            this.heartbeat.start();
            this.emit(Events.OPENED);
        };

        client.onclose = (): void => {
            this.heartbeat.stop();
            this.emit(Events.CLOSED);
        };

        client.onerror = (e): void => {
            if (e.message === 'Unexpected server response: 401') {
                this.emit(Events.UNAUTHORIZED);
                return;
            }

            this.emit(Events.ERROR, e);
        };

        return client;
    }

    private createConfig(username: string | undefined, password: string | undefined): Config {
        return {
            username: username ?? process.env.SMHI_USERNAME,
            password: password ?? process.env.SMHI_PASSWORD,
            url: process.env.SMHI_URL ?? SMHI_URL,
            timeout: process.env.SMHI_TIMEOUT ? parseInt(process.env.SMHI_TIMEOUT) : SMHI_TIMEOUT,
            interval: process.env.SMHI_INTERVAL ? parseInt(process.env.SMHI_INTERVAL) : SMHI_INTERVAL
        };
    }

    private getAuthString(): string {
        return Buffer.from(this.config.username + ':' + this.config.password).toString('base64');
    }

    private getAuthorization(): string {
        const auth = `Basic ${this.getAuthString()}`;
        return `Bearer ${auth}`;
    }
}
