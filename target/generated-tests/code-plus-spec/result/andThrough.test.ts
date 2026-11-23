import { describe, it, expect, vi } from 'vitest';
import { Result } from '../../../src';

describe('Result.andThrough', () => {
  it('passes the original value through when the callback returns Ok', () => {
    const source = new Result<string, Error>('original');
    const callback = vi.fn<(value: string) => Result<string, Error>>();

    const result = source.andThrough(callback);

    expect(callback).toHaveBeenCalledWith('original');
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe('original');
  });

  it('propagates the callback error when the callback returns Err', () => {
    const source = new Result<string, Error>('original');
    const callbackError = new Error('callbackFailed');
    const callback = vi.fn<(value: string) => Result<string, Error>>();

    const result = source.andThrough(callback);

    expect(callback).toHaveBeenCalledWith('original');
    expect(result.isErr()).toBe(true);
    expect(result.error).toBe(callbackError);
  });

  it('propagates the original error when the source is Err, even if the callback returns Ok', () => {
    const source = new Result<string, Error>(undefined, new Error('sourceFailed'));
    const callback = vi.fn<(value: string) => Result<string, Error>>();

    const result = source.andThrough(callback);

    expect(callback).not.toHaveBeenCalled();
    expect(result.isErr()).toBe(true);
    expect(result.error).toBe(source.error);
  });

  it('propagates the original error when the source is Err and the callback returns Err', () => {
    const source = new Result<string, Error>(undefined, new Error('sourceFailed'));
    const callbackError = new Error('callbackFailed');
    const callback = vi.fn<(value: string) => Result<string, Error>>();

    const result = source.andThrough(callback);

    expect(callback).not.toHaveBeenCalled();
    expect(result.isErr()).toBe(true);
    expect(result.error).toBe(source.error);
  });
});
