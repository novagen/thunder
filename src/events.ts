export class Events {
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
}
