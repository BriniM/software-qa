import { describe, it, expect, vi } from 'vitest';
import { ok, err } from '../../../src';

describe('orElse', () => {
  describe('Ok#orElse', () => {
    it('returns an Ok containing the original value', () => {
      const result = ok(42);
      const mapped = result.orElse(() => 'fallback');
      expect((mapped as any).value).toBe(42);
    });

    it('ignores the fallback function entirely', () => {
      const fn = vi.fn();
      const result = ok('present');
      const mapped = result.orElse(fn);
      expect(fn).not.toHaveBeenCalled();
      expect((mapped as any).value).toBe('present');
    });

    it('preserves falsy values', () => {
      for (const value of [0, '', false, null, undefined]) {
        const result = ok(value);
        const mapped = result.orElse(() => 'fallback');
        expect((mapped as any).value).toBe(value);
      }
    });
  });

  describe('Err#orElse', () => {
    it('applies the fallback to the error and returns its result', () => {
      const result = err('boom');
      const mapped = result.orElse((e) => `caught: ${e}`);
      expect(mapped).toBe('caught: boom');
    });

    it('passes the error value to the fallback', () => {
      const result = err(42);
      const fn = vi.fn((v: any) => v * 2);
      const mapped = result.orElse(fn);
      expect(fn).toHaveBeenCalledWith(42);
      expect(mapped).toBe(84);
    });

    it('passes the original error reference to the fallback', () => {
      const original = { code: 'E001' };
      const result = err(original);
      const fn = vi.fn();
      const mapped = result.orElse(fn);
      expect(fn).toHaveBeenCalledWith(original);
      expect(mapped).toBe(original);
    });

    it('handles falsy error values', () => {
      for (const error of [0, '', false, null, undefined]) {
        const fn = vi.fn((e: unknown) => (e === null ? 'null' : `v=${e}`));
        const result = err(error);
        const mapped = result.orElse(fn);
        expect(fn).toHaveBeenCalledWith(error);
        expect(mapped).toBe(fn(error));
      }
    });
  });
});
