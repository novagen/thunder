import { expect, describe, it, vi } from 'vitest';
import { Client, Events } from '.';
import { WebSocketServer } from 'ws';

process.env.SMHI_URL = "ws://localhost:8971";

const delay = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 20));

const wss = new WebSocketServer({
    port: 8971
});

const sendHeartbeat = (): Promise<void> => {
    for (const client of wss.clients) {
        client.send(JSON.stringify({
            time: new Date().toISOString(),
            countryCode: 'ZZ'
        }));
    }

    return delay();
};

const sendStrike = (): Promise<void> => {
    for (const client of wss.clients) {
        client.send(JSON.stringify({
            time: new Date().toISOString(),
            countryCode: "SE",
            pos: {
                lat: 61.8996,
                lon: 14.7107,
                proj: "EPSG:4326"
            },
            meta: {
                peakCurrent: 123,
                cloudIndicator: 0
            }
        }));
    }

    return delay();
};

describe('Client', () => {
    it(`Should be able to call start`, async () => {
        const client = new Client();
        expect(await client.start()).to.equal(undefined);
    });

    it(`Should receive heartbeat`, async () => {
        const client = new Client();
        const heartbeat = { func: (): void => { /** empty */} };
        const spy = vi.spyOn(heartbeat, 'func');

        client.on(Events.HEARTBEAT, heartbeat.func);

        await client.start();
        await sendHeartbeat();

        expect(spy).to.be.toHaveBeenCalledOnce();
    });

    it(`Should receive strike`, async () => {
        const client = new Client();
        const strike = { func: (): void => { /** empty */} };
        const spy = vi.spyOn(strike, 'func');

        client.on(Events.STRIKE, strike.func);

        await client.start();
        await sendStrike();

        expect(spy).to.be.toHaveBeenCalledOnce();
    });

    it(`Should be able to call stop`, () => {
        const client = new Client();
        expect(client.stop()).to.equal(undefined);
    });

    it(`WebSocket should be NOT be null after start`, async () => {
        const client = new Client();

        await client.start();

        expect(client.getWebSocket()).to.toBeTypeOf('object');
        client.stop();
    });

    it(`WebSocket should be be null after stop`, async () => {
        const client = new Client();

        await client.start();
        client.stop();

        expect(client.getWebSocket()).to.equal(null);
    });
});
