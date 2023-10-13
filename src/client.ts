import EventEmitter from 'events';
import { WebSocket, MessageEvent } from 'ws';
import { Config, Strike } from './types';
import { Events } from './events';
import { Heartbeat } from './heartbeat';

const SMHI_URL = 'ws://data-push.smhi.se/api/category/lightning-strike/version/1/country-code/SE/data.json';
const SMHI_TIMEOUT = 35000;
const SMHI_INTERVAL = 1000;

/**
 * Thunder Client.
 */
export class Client extends EventEmitter {
    private _client: WebSocket | null = null;
    private _config: Config;
    private _heartbeat: Heartbeat;

    /**
     * Create a new ThunderClient.
     * @param {string} username The username to use for authentication. If not provied the SMHI_USERNAME environment variable will be used.
     * @param {string} password The password to use for authentication. If not provied the SMHI_PASSWORD environment variable will be used.
     * @returns {Client} A new ThunderClient instance.
     * @constructor
     * @public
     */
    public constructor(username: string | undefined = undefined, password: string | undefined = undefined) {
        super();

        this._config = Client.createConfig(username, password);
        this._heartbeat = new Heartbeat(SMHI_TIMEOUT, SMHI_INTERVAL, () => {
            this.emit(Events.TIMEOUT);
            this.stop(true);
            this.start(true);
        });
    }

    /** 
     * Get configuration.
     * @returns {Config} The configuration.
     */
    public get config(): Config {
        return this._config;
    }

    /**
     * Get heartbeat monitor.
     * @returns {Heartbeat} The heartbeat monitor.
     */
    public get heartbeat(): Heartbeat {
        return this._heartbeat;
    }

    /**
     * Start the client.
     * @param {boolean} noEmit If true, the client will not emit the STARTED event.
     * @returns {void}
     */
    public start(noEmit = false): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            if (!this._client) {
                this._client = this.createClient(resolve, reject);
            }

            if (this._client) {
                this._client.onmessage = (e): void => this.onMessage(e);
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
        if (this._client) {
            this._client.close();
            this._client.onmessage = null;
            this._client = null;
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
        return this._client;
    }

    /**
     * Handler for incoming messages.
     * @param {MessageEvent} m The message event.
     */
    private onMessage(m: MessageEvent): void {
        const data: Strike = JSON.parse(m.data as string);

        if (data.countryCode === 'ZZ') {
            this._heartbeat.beat();
            this.emit(Events.HEARTBEAT, this._heartbeat);
            return;
        }

        this.emit(Events.STRIKE, data);
    }

    /**
     * Create websocket client.
     * @param {Function} resolve The resolve function.
     * @param {Function} reject The reject function.
     * @returns {WebSocket} The websocket client.
     */
    private createClient(resolve: (value: void | PromiseLike<void>) => void, reject: () => void): WebSocket {
        const client = new WebSocket(this._config.url, 'echo-protocol', {
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
            this._heartbeat.start();
            this.emit(Events.OPENED);
        };

        client.onclose = (): void => {
            this._heartbeat.stop();
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

    /** 
     * Create config.
     * @param {string} username The username to use for authentication. If not provied the SMHI_USERNAME environment variable will be used.
     * @param {string} password The password to use for authentication. If not provied the SMHI_PASSWORD environment variable will be used.
     * @returns {Config} The config.
    */
    private static createConfig(username: string | undefined, password: string | undefined): Config {
        return {
            username: username ?? process.env.SMHI_USERNAME,
            password: password ?? process.env.SMHI_PASSWORD,
            url: process.env.SMHI_URL ?? SMHI_URL,
            timeout: process.env.SMHI_TIMEOUT ? parseInt(process.env.SMHI_TIMEOUT) : SMHI_TIMEOUT,
            interval: process.env.SMHI_INTERVAL ? parseInt(process.env.SMHI_INTERVAL) : SMHI_INTERVAL
        };
    }

    /** 
     * Create base64 encoded auth string.
     * @returns {string} The base64 encoded auth string.
     */
    private getAuthString(): string {
        return Buffer.from(`${this._config.username}:${this._config.password}`).toString('base64');
    }

    /**
     * Create authorization header.
     * @returns {string} The authorization header.
     */
    private getAuthorization(): string {
        const auth = `Basic ${this.getAuthString()}`;
        return `Bearer ${auth}`;
    }
}
