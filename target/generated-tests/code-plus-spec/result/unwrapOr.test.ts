import { describe, it, expect } from 'vitest';
import { Result, Ok, Err } from '../../../src';

describe('Result.unwrapOr', () => {
  it('returns the Ok value when the result is Ok', () => {
    const result = Ok(5);
    expect(result.unwrapOr(10)).toBe(5);
  });

  it('returns the default value when the result is Err', () => {
    const result = Err('Oh no');
    expect(result.unwrapOr(10)).toBe(10);
  });

  it('returns the Ok value and ignores the default on success', () => {
    const result = Ok('hello');
    expect(result.unwrapOr('world')).toBe('hello');
  });

  it('exercises map before unwrapOr as in the README example', () => {
    const myResult = Err('Oh noooo');
    const multiply = (value: number): number => value * 2;
    const unwrapped: number = myResult.map(multiply).unwrapOr(10);
    expect(unwrapped).toBe(10);
  });

  it('returns the Ok value for falsy-but-valid values', () => {
    expect(Ok(0).unwrapOr(10)).toBe(0);
    expect(Ok('').unwrapOr('default')).toBe('');
    expect(Ok(false).unwrapOr(true)).toBe(false);
    expect(Ok(null).unwrapOr('default')).toBe(null);
    expect(Ok(undefined).unwrapOr('default')).toBe(undefined);
  });

  it('always returns the default when the Ok value is falsy', () => {
    const result = Ok(0);
    expect(result.unwrapOr(10)).toBe(0);
    const empty = Ok('');
    expect(empty.unwrapOr('default')).toBe('');
    const falsey = Ok(false);
    expect(falsey.unwrapOr(true)).toBe(false);
  });

  it('returns values of various primitive types', () => {
    expect(Ok(5).unwrapOr(10)).toBe(5);
    expect(Ok('hi').unwrapOr('bye')).toBe('hi');
    expect(Ok(3.14).unwrapOr(2.71)).toBe(3.14);
    expect(Ok(true).unwrapOr(false)).toBe(true);
  });

  it('returns references to the original Ok value', () => {
    const obj = { a: 1 };
    const arr = [1, 2, 3];
    const sym = Symbol('test');
    expect(Ok(obj).unwrapOr({ b: 2 })).toBe(obj);
    expect(Ok(arr).unwrapOr([4, 5, 6])).toBe(arr);
    expect(Ok(sym).unwrapOr(Symbol('other'))).toBe(sym);
  });

  it('returns the default for objects and arrays on Err', () => {
    expect(Err('boom').unwrapOr({ a: 1 })).toEqual({ a: 1 });
    expect(Err('boom').unwrapOr([1, 2])).toEqual([1, 2]);
  });

  it('works with the generic type parameter', () => {
    const result: Result<number, string> = Ok(42);
    expect(result.unwrapOr(-1)).toBe(42);
    const errResult: Result<string, number> = Err(1);
    expect(errResult.unwrapOr('fallback')).toBe('fallback');
  });
});
