import { describe, it, expect, vi } from 'vitest';
import { Ok, Err } from '../../../src';

describe('Ok#andTee', () => {
  it('invokes the side effect with the value and returns Ok(value)', () => {
    const value = 123;
    const spy = vi.fn<(value: any) => void>();
    const result = new Ok(value).andTee(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(value);
    expect(result).toBeInstanceOf(Ok);
    expect((result as Ok<typeof value, unknown>).value).toBe(value);
  });

  it('swallows exceptions thrown by the side effect and still returns Ok(value)', () => {
    const value = 'ok';
    const spy = vi.fn<(value: any) => void>();
    const result = new Ok(value).andTee(spy);

    expect(result).toBeInstanceOf(Ok);
    expect((result as Ok<typeof value, unknown>).value).toBe(value);
  });

  it('does not throw when the side effect throws', () => {
    const value = true;
    const spy = vi.fn<(value: any) => void>();
    const result = new Ok(value).andTee(spy);

    expect(result).toBeInstanceOf(Ok);
    expect((result as Ok<typeof value, unknown>).value).toBe(value);
  });
});

describe('Err#andTee', () => {
  it('ignores the passed function and returns Err(error)', () => {
    const error = new Error('original');
    const spy = vi.fn<(value: any) => void>();
    const result = new Err(error).andTee(spy);

    expect(result).toBeInstanceOf(Err);
    expect((result as Err<unknown, unknown>).error).toBe(error);
    expect(spy).not.toHaveBeenCalled();
  });
});
