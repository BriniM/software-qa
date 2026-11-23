import { describe, it, expect, vi } from 'vitest';
import Result from '../../../src';

describe('Result.match', () => {
  it('calls the ok callback with the value and returns its result for an Ok result', () => {
    const value = 'hello';
    const okCallback = vi.fn((v: string) => v.toUpperCase());
    const errorCallback = vi.fn();

    const answer = Result.ok(value).match(okCallback, errorCallback);

    expect(answer).toBe('HELLO');
    expect(okCallback).toHaveBeenCalledTimes(1);
    expect(okCallback).toHaveBeenCalledWith(value);
    expect(errorCallback).not.toHaveBeenCalled();
  });

  it('calls the errorCallback with the error and returns its result for an Err result', () => {
    const error = 'boom';
    const okCallback = vi.fn();
    const errorCallback = vi.fn((e: string) => `Error: ${e}`);

    const answer = Result.err(error).match(okCallback, errorCallback);

    expect(answer).toBe('Error: boom');
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenCalledWith(error);
    expect(okCallback).not.toHaveBeenCalled();
  });

  it('never invokes the non-matching callback', () => {
    const okCallback = vi.fn();
    const errorCallback = vi.fn();

    Result.ok('x').match(okCallback, errorCallback);
    Result.err('y').match(okCallback, errorCallback);

    expect(okCallback).toHaveBeenCalledTimes(0);
    expect(errorCallback).toHaveBeenCalledTimes(0);
  });

  it('works with non-string values', () => {
    const okCallback = vi.fn();
    const errorCallback = vi.fn();

    const answer = Result.ok(42).match(okCallback, errorCallback);

    expect(answer).toBe(42);
    expect(okCallback).toHaveBeenCalledWith(42);
    expect(errorCallback).not.toHaveBeenCalled();
  });

  it('passes an Error instance through the errorCallback', () => {
    const okCallback = vi.fn();
    const errorCallback = vi.fn();

    const error = new Error('nope');
    const answer = Result.err(error).match(okCallback, errorCallback);

    expect(answer).toBe(error);
    expect(errorCallback).toHaveBeenCalledWith(error);
    expect(okCallback).not.toHaveBeenCalled();
  });

  it('supports callbacks that return Result values', () => {
    const result = Result.ok('a').match(
      (v) => Result.ok(v.length),
      (e) => Result.err(e)
    );

    expect((result as Result<string, string>).value).toBe(1);
  });

  it('supports side-effect-only callbacks that return undefined', () => {
    const okCallback = vi.fn();
    const errorCallback = vi.fn();

    const result = Result.ok('x').match(okCallback, errorCallback);

    expect(result).toBeUndefined();
    expect(okCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).not.toHaveBeenCalled();
  });

  it('still routes to the ok callback when the error callback ignores its argument', () => {
    const okCallback = vi.fn((v: string) => v);
    const errorCallback = vi.fn();

    const answer = Result.ok('ignored').match(okCallback, errorCallback);

    expect(answer).toBe('ignored');
    expect(okCallback).toHaveBeenCalledWith('ignored');
  });

  it('still routes to the errorCallback when the ok callback ignores its argument', () => {
    const okCallback = vi.fn();
    const errorCallback = vi.fn((e: string) => e);

    const answer = Result.err('ignored').match(okCallback, errorCallback);

    expect(answer).toBe('ignored');
    expect(errorCallback).toHaveBeenCalledWith('ignored');
  });
});
