import { describe, it, expect } from 'vitest';
import { Ok, Err } from '../../../src';

describe('isOk', () => {
  it('returns true for Ok values', () => {
    const ok: Ok<number> = Ok(1);
    expect(ok.isOk()).toBe(true);
  });

  it('returns false for Err values', () => {
    const err: Err<number> = Err('fail');
    expect(err.isOk()).toBe(false);
  });
});
