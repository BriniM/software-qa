import { describe, it, expect } from 'vitest';

import { Ok, Err } from '../../../src';

describe('Result.isErr', () => {
  it('returns true for an Err variant', () => {
    expect(Err('boom').isErr()).toBe(true);
  });

  it('returns false for an Ok variant', () => {
    expect(Ok(42).isErr()).toBe(false);
  });

  it('treats falsy Ok values as Ok (boundary)', () => {
    for (const value of [0, '', false, null, undefined]) {
      expect(Ok(value).isErr()).toBe(false);
    }
  });

  it('treats falsy Err values as Err (boundary)', () => {
    for (const value of [0, '', false, null, undefined]) {
      expect(Err(value).isErr()).toBe(true);
    }
  });

  it('returns false for Ok variants with arbitrary values', () => {
    for (const value of [1, 'ok', [], {}, { a: 1 }]) {
      expect(Ok(value).isErr()).toBe(false);
    }
  });

  it('returns true for Err variants with arbitrary values', () => {
    for (const value of [1, 'error', [], {}, { a: 1 }]) {
      expect(Err(value).isErr()).toBe(true);
    }
  });
});
