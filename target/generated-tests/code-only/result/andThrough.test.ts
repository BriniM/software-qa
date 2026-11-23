import { describe, it, expect, vi } from 'vitest';
import { Ok, Err } from '../../../src';

describe('andThrough', () => {
  it('Ok: preserves the original value when the function succeeds', () => {
    const result = Ok(1).andThrough((value) => Ok(value + 1));
    expect(result).toEqual(Ok(1));
  });

  it('Ok: propagates the error produced by the function', () => {
    const result = Ok('a').andThrough(() => Err('boom'));
    expect(result).toEqual(Err('boom'));
  });

  it('Ok: passes the original value to the function', () => {
    const spy = vi.fn((value) => Ok(value));
    const result = Ok(99).andThrough(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(99);
    expect(result).toEqual(Ok(99));
  });

  it('Ok: ignores the function result value and keeps the original value', () => {
    const result = Ok(0).andThrough((value) => Ok(value * 2));
    expect(result).toEqual(Ok(0));
  });

  it('Ok: works with falsy values', () => {
    const result = Ok('').andThrough((value) => Ok(value));
    expect(result).toEqual(Ok(''));
  });

  it('Err: ignores the function and returns the original error', () => {
    const spy = vi.fn();
    const result = Err('boom').andThrough(spy);
    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual(Err('boom'));
  });

  it('Err: ignores a successful function result', () => {
    const result = Err('x').andThrough(() => Ok(1));
    expect(result).toEqual(Err('x'));
  });
});
