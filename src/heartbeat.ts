/**
 * Heartbeat monitor.
 */
export class Heartbeat {
    private timeout: number;
    private interval: number;
    private handler: NodeJS.Timeout | null = null;
    private heartbeat: Date = new Date();
    private onMissed: () => void;

    /** 
     * Create a new heartbeat monitor.
     * @param {number} timeout The timeout in milliseconds.
     * @param {number} interval The interval in milliseconds.
     * @param {() => void} onMissed The function to call when a heartbeat is missed.
     * @returns {Heartbeat} A new Heartbeat instance.
     * @constructor
     * @public
     */
    public constructor(timeout: number, interval: number, onMissed: () => void) {
        this.timeout = timeout;
        this.interval = interval;
        this.onMissed = onMissed;
    }

    /**
     * Start heartbeat monitor.
     */
    public start(): void {
        this.heartbeat = new Date();
        this.handler = setInterval(() => this.check(), this.interval);
    }

    /**
     * Stop heartbeat monitor.
     */
    public stop(): void {
        if (this.handler) {
            clearInterval(this.handler);
            this.handler = null;
        }
    }

    /** 
     * Update timestamp when a heartbeat occurs.
     */
    public beat(): void {
        this.heartbeat = new Date();
    }

    /** 
     * Check when last heartbeat was trigged, and trigger onMissed if it's too long ago.
     * */
    private check(): void {
        if (this.heartbeat.getTime() + this.timeout < new Date().getTime()) {
            this.onMissed();
        }
    }
}