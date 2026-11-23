import { describe, it, expect } from 'vitest';
import { Ok, Err } from '../../../src';

describe('Result.isOk', () => {
  it('returns true for Ok variant', () => {
    expect(new Ok('value').isOk()).toBe(true);
  });

  it('returns true for Ok variant regardless of the wrapped value', () => {
    expect(new Ok(42).isOk()).toBe(true);
    expect(new Ok(null).isOk()).toBe(true);
    expect(new Ok(undefined).isOk()).toBe(true);
  });

  it('returns false for Err variant', () => {
    expect(new Err('error').isOk()).toBe(false);
    expect(new Err({ code: 500 }).isOk()).toBe(false);
  });
});
