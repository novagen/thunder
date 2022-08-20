import { expect, describe, it } from 'vitest';

import { ThunderClient } from '../src';
const client = ThunderClient.getInstance();

describe('Config', () => {
    it(`Should be able to call stop`, () => {
        expect(client.stop()).to.equal(undefined);
    });
});
