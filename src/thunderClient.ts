import EventEmitter from 'events';
import { WebSocket, MessageEvent } from 'ws';
import * as SMHI from './types/smhi';

export class ThunderClient extends EventEmitter {
    private static readonly url = process.env.SMHI_URL ?? 'ws://data-push.smhi.se/api/category/lightning-strike/version/1/country-code/SE/data.json';
    private static readonly username = process.env.SMHI_USERNAME;
    private static readonly password = process.env.SMHI_PASSWORD;

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

    private static instance: ThunderClient;
    private client: WebSocket | null = null;
    private heartbeat: Date = new Date();

    public static getInstance(): ThunderClient {
        if (!ThunderClient.instance) {
            ThunderClient.instance = new ThunderClient();
        }

        return ThunderClient.instance;
    }

    public constructor() {
        super();
    }

    public start(): void {
        if (!this.client) {
            this.client = this.createClient();
        }

        if (this.client) {
            this.client.onmessage = this.onMessage;
        }

        this.emit(ThunderClient.STARTED);
    }

    public stop(): void {
        if (this.client) {
            this.client.close();
            this.client.onmessage = null;
            this.client = null;
        }

        this.emit(ThunderClient.STOPPED);
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
        const client = new WebSocket(ThunderClient.url, 'echo-protocol', {
            headers: {
                'Authorization': this.getAuthorization()
            }
        });

        client.onopen = (): void => {
            this.emit(ThunderClient.OPENED);
        };

        client.onclose = (): void => {
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

    private getAuthorization(): string {
        const auth = 'Basic ' + Buffer.from(ThunderClient.username + ':' + ThunderClient.password).toString('base64');
        return `Bearer ${auth}`;
    }
}

export {
    ThunderClient as SMHIClient
};