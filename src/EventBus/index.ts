export class EventBus {
  private static instance: EventBus | null = null;
  private listeners: Map<string, ((payload: unknown) => void)[]> = new Map();

  private constructor() {}

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(eventName: string, callback: (payload: unknown) => void) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)?.push(callback);
  }

  emit(eventName: string, payload: unknown) {
    this.listeners.get(eventName)?.forEach((callbackfn) => callbackfn(payload));
  }

  clear() {
    EventBus.instance = null;
  }
}
