import EventEmitter from 'events';
import { WebSocket, MessageEvent } from 'ws';
import { Config } from './types';
import * as SMHI from './types/smhi';
import { Events } from './events';

export class Client extends EventEmitter {
    private static readonly hearbeatTimeout = 35000;
    private static readonly heartbeatInterval = 1000;

    private client: WebSocket | null = null;
    private heartbeat: Date = new Date();
    private config: Config;
    private heartbeatTimeout: NodeJS.Timeout | null = null;

    /**
     * Create a new ThunderClient.
     * @param {string} username The username to use for authentication. If not provied the SMHI_USERNAME environment variable will be used.
     * @param {string} password The password to use for authentication. If not provied the SMHI_PASSWORD environment variable will be used.
     * @returns {Client} A new ThunderClient instance.
     */
    public constructor(username: string | undefined = undefined, password: string | undefined = undefined) {
        super();

        this.config = this.createConfig(username, password);
    }

    /**
     * Start the client.
     * @param {boolean} noEmit If true, the client will not emit the STARTED event.
     * @returns {void}
     */
    public async start(noEmit = false): Promise<void> {
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
    public getClient(): WebSocket | null {
        return this.client;
    }

    private onMessage(m: MessageEvent): void {
        const data: SMHI.Strike = JSON.parse(m.data as string);

        if (data.countryCode == 'ZZ') {
            this.heartbeat = new Date();
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
            this.heartbeatTimeout = setInterval(() => this.checkHeartbeat(), Client.heartbeatInterval);
            this.emit(Events.OPENED);
        };

        client.onclose = (): void => {
            if (this.heartbeatTimeout) {
                clearInterval(this.heartbeatTimeout);
                this.heartbeatTimeout = null;
            }

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
            url: process.env.SMHI_URL ?? 'ws://data-push.smhi.se/api/category/lightning-strike/version/1/country-code/SE/data.json',
            username: username ?? process.env.SMHI_USERNAME,
            password: password ?? process.env.SMHI_PASSWORD
        };
    }

    private getAuthorization(): string {
        const auth = 'Basic ' + Buffer.from(this.config.username + ':' + this.config.password).toString('base64');
        return `Bearer ${auth}`;
    }

    private checkHeartbeat(): void {
        if (this.heartbeat.getTime() + Client.hearbeatTimeout < new Date().getTime()) {
            this.emit(Events.TIMEOUT);
            this.stop(true);
            this.start(true);
        }
    }
}

export {
    Client as SMHIClient
};