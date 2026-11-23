import { describe, it, expect } from 'vitest';
import { Ok, Err } from '../../../src';

describe('Result#isErr', () => {
  it('returns true for an Err instance', () => {
    const result = Err('boom');
    expect(result.isErr()).toBe(true);
  });

  it('returns true for an Err instance with any error type', () => {
    const result = Err(new Error('network'));
    expect(result.isErr()).toBe(true);
  });

  it('returns true for an Err instance with undefined error', () => {
    const result = Err(undefined);
    expect(result.isErr()).toBe(true);
  });

  it('returns false for an Ok instance', () => {
    const result = Ok(1);
    expect(result.isErr()).toBe(false);
  });

  it('returns false for an Ok instance with any value type', () => {
    const result = Ok('hello');
    expect(result.isErr()).toBe(false);
  });

  it('returns false for an Ok instance with a zero/empty value', () => {
    const result = Ok(0);
    expect(result.isErr()).toBe(false);
  });

  it('isErr and isOk are complementary', () => {
    const ok = Ok(42);
    const err = Err('fail');
    expect(ok.isErr()).toBe(!ok.isOk());
    expect(err.isErr()).toBe(!err.isOk());
  });
});
