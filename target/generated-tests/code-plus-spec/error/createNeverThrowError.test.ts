import { describe, it, expect, vi } from 'vitest';
import { ok, err } from '../../../src';
import { createNeverThrowError } from '../../../src/_internals/error';

describe('createNeverThrowError', () => {
  describe('Ok result', () => {
    it('wraps the Ok value in data and omits the stack by default', () => {
      const result = ok('value');
      const error = createNeverThrowError('message', result);

      expect(error.data).toEqual({ type: 'Ok', value: 'value' });
      expect(error.message).toBe('message');
      expect(error.stack).toBeUndefined();
    });
  });

  describe('Err result', () => {
    it('wraps the Err error in data and omits the stack by default', () => {
      const result = err('error');
      const error = createNeverThrowError('message', result);

      expect(error.data).toEqual({ type: 'Err', value: 'error' });
      expect(error.message).toBe('message');
      expect(error.stack).toBeUndefined();
    });
  });

  describe('stack trace', () => {
    it('exposes a stack string when withStackTrace is enabled', () => {
      const result = ok('value');
      const stackSpy = vi.spyOn(Error.prototype, 'stack', 'get');
      stackSpy.mockReturnValue('mocked-stack-trace');

      const error = createNeverThrowError('message', result, { withStackTrace: true });

      expect(error.stack).toBe('mocked-stack-trace');
      expect(stackSpy).toHaveBeenCalledTimes(1);
    });

    it('omits the stack when withStackTrace is disabled', () => {
      const result = ok('value');
      const error = createNeverThrowError('message', result, { withStackTrace: false });

      expect(error.stack).toBeUndefined();
    });
  });
});
