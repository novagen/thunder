import { Meta } from "./Meta";
import { Position } from "./Position";

/**
 * Lightning strike data.
 */
export type Strike = {
    time: string;
    countryCode: string;
    pos: Position;
    meta: Meta;
}
