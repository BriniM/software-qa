import { describe, it, expect } from 'vitest';
import { createNeverThrowError, Ok, Err } from '../../../src';

describe('createNeverThrowError', () => {
  it('maps an Ok result to Ok data', () => {
    const output = createNeverThrowError('boom', Ok('value'));
    expect(output.data).toEqual({ type: 'Ok', value: 'value' });
    expect(output.message).toBe('boom');
    expect(output.stack).toBeUndefined();
  });

  it('maps an Err result to Err data carrying the error', () => {
    const error = new Error('kaboom');
    const output = createNeverThrowError('boom', Err(error));
    expect(output.data).toEqual({ type: 'Err', value: error });
    expect(output.message).toBe('boom');
    expect(output.stack).toBeUndefined();
  });

  it('omits the stack by default', () => {
    const output = createNeverThrowError('boom', Ok(1));
    expect(output.stack).toBeUndefined();
  });

  it('includes a stack trace when withStackTrace is set', () => {
    const output = createNeverThrowError('boom', Ok(1), { withStackTrace: true });
    expect(typeof output.stack).toBe('string');
    expect(output.stack).toContain('Error');
  });

  it('treats an empty config as no stack trace', () => {
    const output = createNeverThrowError('boom', Ok(1), {});
    expect(output.stack).toBeUndefined();
  });

  it('passes the message through unchanged', () => {
    const message = '   spaced   message   ';
    const output = createNeverThrowError(message, Ok(1));
    expect(output.message).toBe(message);
  });

  it('preserves falsy Ok values', () => {
    for (const value of [0, '', null, undefined, false, NaN]) {
      expect(createNeverThrowError('boom', Ok(value)).data.value).toBe(value);
    }
  });

  it('preserves the Err payload regardless of type', () => {
    expect(createNeverThrowError('boom', Err('string')).data.value).toBe('string');
    expect(createNeverThrowError('boom', Err(42)).data.value).toBe(42);
  });
});
