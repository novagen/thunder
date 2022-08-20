import { expect, describe, it } from 'vitest';

import { ThunderClient } from '../src';
const client = new ThunderClient();

describe('Config', () => {
    it(`Should be able to call start`, () => {
        expect(client.start()).to.equal(undefined);
    });

    it(`Should be able to call stop`, () => {
        expect(client.stop()).to.equal(undefined);
    });
});
