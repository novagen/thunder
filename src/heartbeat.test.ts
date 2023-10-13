import { expect, describe, it } from 'vitest';
import { Heartbeat } from './heartbeat';

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

describe('Heartbeat', () => {
    it('should call onMissed if no beat occurs within timeout', async () => {
        const timeout = 100;
        const interval = 10;
        let missed = false;
        const onMissed = (): void => {
            missed = true;
        };
        const heartbeat = new Heartbeat(timeout, interval, onMissed);
        heartbeat.start();
        await delay(timeout + interval);
        expect(missed).to.equal(true);
        heartbeat.stop();
    });

    it('should not call onMissed if beat occurs within timeout', async () => {
        const timeout = 100;
        const interval = 10;
        let missed = false;
        const onMissed = (): void => {
            missed = true;
        };
        const heartbeat = new Heartbeat(timeout, interval, onMissed);
        heartbeat.start();
        await delay(timeout - interval);
        heartbeat.beat();
        await delay(interval);
        expect(missed).to.equal(false);
        heartbeat.stop();
    });

    it('should update heartbeat timestamp on beat', async () => {
        const timeout = 100;
        const interval = 10;
        const onMissed = (): void => {
            /** empty */
        };
        const heartbeat = new Heartbeat(timeout, interval, onMissed);
        heartbeat.start();
        const initialHeartbeat = heartbeat['heartbeat'];
        await delay(interval);
        heartbeat.beat();
        const newHeartbeat = heartbeat['heartbeat'];
        expect(newHeartbeat.getTime() - initialHeartbeat.getTime()).to.be.greaterThan(interval - 1);
        heartbeat.stop();
    });
});