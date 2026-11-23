import { describe, it, expect, vi } from 'vitest';
import { Ok, Err } from '../../../src';

describe('match', () => {
  describe('Ok#match', () => {
    it('invokes the Ok handler with the value and ignores the Err handler', () => {
      const ok = Ok(42);
      const okHandler = vi.fn();
      const errHandler = vi.fn();
      const result = ok.match(okHandler, errHandler);

      expect(result).toBe(42);
      expect(okHandler).toHaveBeenCalledTimes(1);
      expect(okHandler).toHaveBeenCalledWith(42);
      expect(errHandler).not.toHaveBeenCalled();
    });

    it('transforms the value before returning', () => {
      const ok = Ok(2);
      const result = ok.match(v => v * 2, vi.fn());
      expect(result).toBe(4);
    });

    it('passes a string to a handler returning a new type', () => {
      const ok = Ok('hello');
      const result = ok.match(v => v.toUpperCase(), vi.fn());
      expect(result).toBe('HELLO');
    });

    it('returns the value unchanged when the handler is identity', () => {
      const ok = Ok('value');
      const result = ok.match(v => v, vi.fn());
      expect(result).toBe('value');
    });

    it('handles falsy values', () => {
      const cases = [undefined, null, 0, '', false];
      for (const value of cases) {
        const ok = Ok(value);
        const result = ok.match(v => v, vi.fn());
        expect(result).toBe(value);
      }
    });

    it('handles an undefined value', () => {
      const ok = Ok(undefined);
      const result = ok.match(v => v, vi.fn());
      expect(result).toBeUndefined();
    });
  });

  describe('Err#match', () => {
    it('invokes the Err handler with the error and ignores the Ok handler', () => {
      const err = Err('boom');
      const okHandler = vi.fn();
      const errHandler = vi.fn();
      const result = err.match(okHandler, errHandler);

      expect(result).toBe('boom');
      expect(errHandler).toHaveBeenCalledTimes(1);
      expect(errHandler).toHaveBeenCalledWith('boom');
      expect(okHandler).not.toHaveBeenCalled();
    });

    it('transforms the error before returning', () => {
      const err = Err('error');
      const result = err.match(v => v, e => e + '!');
      expect(result).toBe('error!');
    });

    it('passes an object error to a handler returning a new type', () => {
      const err = Err({ code: 500 });
      const result = err.match(v => v, e => e.code);
      expect(result).toBe(500);
    });

    it('returns the error unchanged when the handler is identity', () => {
      const err = Err('value');
      const result = err.match(v => v, e => e);
      expect(result).toBe('value');
    });

    it('handles falsy errors', () => {
      const cases = [undefined, null, 0, '', false];
      for (const error of cases) {
        const err = Err(error);
        const result = err.match(v => v, e => e);
        expect(result).toBe(error);
      }
    });

    it('handles an undefined error', () => {
      const err = Err(undefined);
      const result = err.match(v => v, e => e);
      expect(result).toBeUndefined();
    });
  });
});
