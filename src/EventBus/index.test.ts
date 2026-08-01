import { describe, test, expect, vi, afterAll } from 'vitest';
import { EventBus } from './index.ts';

afterAll(() => {
  EventBus.getInstance().clear();
});

describe('EventBus', () => {
  test('retourne toujours la même instance', () => {
    expect(EventBus.getInstance()).toBe(EventBus.getInstance());
  });

  test('emit appelle tous les listeners enregistrés sur un event', () => {
    const bus = EventBus.getInstance();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    bus.on('demo:event', listenerA);
    bus.on('demo:event', listenerB);
    bus.emit('demo:event', { foo: 'bar' });

    expect(listenerA).toHaveBeenCalledWith({ foo: 'bar' });
    expect(listenerB).toHaveBeenCalledWith({ foo: 'bar' });
  });

  test("emit sur un event sans listener ne lève pas d'erreur", () => {
    const bus = EventBus.getInstance();

    expect(() => bus.emit('demo:unheard', undefined)).not.toThrow();
  });

  test('clear réinitialise le singleton', () => {
    const first = EventBus.getInstance();
    first.clear();

    expect(EventBus.getInstance()).not.toBe(first);
  });
});
