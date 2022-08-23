export class Heartbeat {
    private timeout: number;
    private interval: number;
    private handler: NodeJS.Timeout | null = null;
    private heartbeat: Date = new Date();
    private onMissed: () => void;

    constructor(timeout: number, interval: number, onMissed: () => void) {
        this.timeout = timeout;
        this.interval = interval;
        this.onMissed = onMissed;
    }

    public start(): void {
        this.heartbeat = new Date();
        this.handler = setInterval(() => this.check(), this.interval);
    }

    public stop(): void {
        if (this.handler) {
            clearInterval(this.handler);
            this.handler = null;
        }
    }

    public beat(): void {
        this.heartbeat = new Date();
    }

    private check(): void {
        if (this.heartbeat.getTime() + this.timeout < new Date().getTime()) {
            this.onMissed();
        }
    }
}