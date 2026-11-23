import { describe, it, expect, vi } from 'vitest';
import { Ok, Err } from '../../../src';

describe('Ok#andTee', () => {
  it('passes the value to the function and returns ok with the same value', () => {
    const ok = Ok(1);
    const spy = vi.fn();
    const result = ok.andTee(spy);
    expect(result).toBe(ok);
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('swallows errors thrown by the function and still returns ok', () => {
    const ok = Ok('x');
    const spy = vi.fn(() => {
      throw new Error('boom');
    });
    const result = ok.andTee(spy);
    expect(result).toBe(ok);
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe('x');
    expect(spy).toHaveBeenCalled();
  });

  it('ignores the return value of the function', () => {
    const ok = Ok(5);
    const spy = vi.fn(() => 999);
    const result = ok.andTee(spy);
    expect(result.value).toBe(5);
  });

  it('handles a boundary value of zero', () => {
    const ok = Ok(0);
    const spy = vi.fn();
    const result = ok.andTee(spy);
    expect(result.value).toBe(0);
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('handles a falsy value', () => {
    const ok = Ok(false);
    const spy = vi.fn();
    const result = ok.andTee(spy);
    expect(result.value).toBe(false);
    expect(spy).toHaveBeenCalledWith(false);
  });
});

describe('Err#andTee', () => {
  it('ignores the function argument and returns err with the same error', () => {
    const err = Err('nope');
    const spy = vi.fn();
    const result = err.andTee(spy);
    expect(result).toBe(err);
    expect(result.isErr()).toBe(true);
    expect(result.error).toBe('nope');
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not throw even if the ignored function throws', () => {
    const err = Err(new Error('nope'));
    const spy = vi.fn(() => {
      throw new Error('boom');
    });
    const result = err.andTee(spy);
    expect(result).toBe(err);
    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
  });
});
