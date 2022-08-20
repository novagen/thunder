import { Meta } from "./Meta";
import { Position } from "./Position";

export type Strike = {
    time: string;
    countryCode: string;
    pos: Position;
    meta: Meta;
}
