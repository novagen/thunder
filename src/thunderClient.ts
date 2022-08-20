import EventEmitter from 'events';
import { WebSocket, MessageEvent } from 'ws';
import { Config } from './types';
import * as SMHI from './types/smhi';

export class ThunderClient extends EventEmitter {
    /** Emitted if an error occurs. */
    public static readonly ERROR = 'ERROR';
    /** Emitted when a lightning strike is received. */
    public static readonly STRIKE = 'STRIKE';
    /** Emitted when a heartbeat is received. */
    public static readonly HEARTBEAT = 'HEARTBEAT';
    /** Emitted when the websocket is opened. */
    public static readonly OPENED = 'OPENED';
    /** Emitted when the websocket is closed. */
    public static readonly CLOSED = 'CLOSED';
    /** Emitted when the websocket connection was unauthorized. */
    public static readonly UNAUTHORIZED = 'UNAUTHORIZED';
    /** Emitted when the client is started. */
    public static readonly STARTED = 'STARTED';
    /** Emitted when the client is stopped. */
    public static readonly STOPPED = 'STOPPED';
    /** Emitted when a timeout occurs. The client will try to reconnect. */
    public static readonly TIMEOUT = 'TIMEOUT';

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
     * @returns {ThunderClient} A new ThunderClient instance.
     */
    public constructor(username: string | undefined, password: string | undefined) {
        super();

        this.config = this.createConfig(username, password);
    }

    /**
     * Start the client.
     * @param {boolean} noEmit If true, the client will not emit the STARTED event.
     * @returns {void}
     */
    public start(noEmit = false): void {
        if (!this.client) {
            this.client = this.createClient();
        }

        if (this.client) {
            this.client.onmessage = this.onMessage;
        }

        if (!noEmit) {
            this.emit(ThunderClient.STARTED);
        }
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
            this.emit(ThunderClient.STOPPED);
        }
    }

    private onMessage(m: MessageEvent): void {
        const data: SMHI.Strike = JSON.parse(m.data.toString());

        if (data.countryCode == 'ZZ') {
            this.heartbeat = new Date();
            this.emit(ThunderClient.HEARTBEAT, this.heartbeat);
            return;
        }

        this.emit(ThunderClient.STRIKE, data);
    }

    private createClient(): WebSocket {
        const client = new WebSocket(this.config.url, 'echo-protocol', {
            headers: {
                'Authorization': this.getAuthorization()
            }
        });

        client.onopen = (): void => {
            this.heartbeatTimeout = setInterval(() => this.checkHeartbeat(), ThunderClient.heartbeatInterval);
            this.emit(ThunderClient.OPENED);
        };

        client.onclose = (): void => {
            if (this.heartbeatTimeout) {
                clearInterval(this.heartbeatTimeout);
                this.heartbeatTimeout = null;
            }

            this.emit(ThunderClient.CLOSED);
        };

        client.onerror = (e): void => {
            if (e.message === 'Unexpected server response: 401') {
                this.emit(ThunderClient.UNAUTHORIZED);
                return;
            }

            this.emit(ThunderClient.ERROR, e);
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
        if (this.heartbeat.getTime() + ThunderClient.hearbeatTimeout < new Date().getTime()) {
            this.emit(ThunderClient.TIMEOUT);
            this.stop(true);
            this.start(true);
        }
    }
}

export {
    ThunderClient as SMHIClient
};