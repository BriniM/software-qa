import { describe, it, expect, vi } from 'vitest'
import { err, ok, Result } from '../../../src'

describe('Result.andThen', () => {
  describe('Ok#andThen', () => {
    it('returns the Ok value produced by the callback', () => {
      const result = ok(2).andThen((value) => ok(value * 2))
      expect(result).toBeInstanceOf(Result)
      expect(result.isOk()).toBe(true)
      expect(result.ok()).toBe(4)
    })

    it('passes the Ok value to the callback', () => {
      let received: number | undefined = undefined
      const result = ok(42).andThen((value) => {
        received = value
        return ok(value)
      })
      expect(received).toBe(42)
      expect(result.ok()).toBe(42)
    })

    it('returns the Err value produced by the callback', () => {
      const result = ok(2).andThen(() => err('boom'))
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBe('boom')
    })

    it('supports returning a distinct error type from the callback', () => {
      const result = ok(2).andThen((value) => err(new Error('distinct')))
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBeInstanceOf(Error)
      expect(result.err().message).toBe('distinct')
    })

    it('flattens a nested Ok result', () => {
      const nested = ok(ok(1234))
      const notNested = nested.andThen((innerResult) => innerResult)
      expect(notNested).toBeInstanceOf(Result)
      expect(notNested.isOk()).toBe(true)
      expect(notNested.ok()).toBe(1234)
    })

    it('flattens a nested Err result', () => {
      const nested = ok(err('nope'))
      const notNested = nested.andThen((innerResult) => innerResult)
      expect(notNested).toBeInstanceOf(Result)
      expect(notNested.isOk()).toBe(true)
      const inner = notNested.ok() as unknown as Result<number, string>
      expect(inner.isErr()).toBe(true)
      expect(inner.err()).toBe('nope')
    })

    it('returns a new Result instance rather than the original', () => {
      const original = ok(2)
      const result = original.andThen((value) => ok(value + 1))
      expect(result).not.toBe(original)
      expect(result).toBeInstanceOf(Result)
    })

    it('preserves boundary values through the Ok case', () => {
      const zero = ok(0).andThen((value) => ok(value))
      expect(zero).toBeInstanceOf(Result)
      expect(zero.isOk()).toBe(true)
      expect(zero.ok()).toBe(0)

      const nullResult = ok(null).andThen((value) => ok(value))
      expect(nullResult).toBeInstanceOf(Result)
      expect(nullResult.isOk()).toBe(true)
      expect(nullResult.ok()).toBe(null)

      const nan = ok(NaN).andThen((value) => ok(value))
      expect(nan).toBeInstanceOf(Result)
      expect(nan.isOk()).toBe(true)
      expect(nan.ok()).toBeNaN()

      const empty = ok('').andThen((value) => ok(value))
      expect(empty).toBeInstanceOf(Result)
      expect(empty.isOk()).toBe(true)
      expect(empty.ok()).toBe('')
    })
  })

  describe('Err#andThen', () => {
    it('short-circuits and returns the original error', () => {
      const result = err(3).andThen((value) => ok(value * 2))
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBe(3)
    })

    it('does not invoke the callback', () => {
      const callback = vi.fn((value: number) => err('ignored'))
      const result = err(3).andThen(callback)
      expect(callback).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBe(3)
    })

    it('ignores an Err that the callback would have produced', () => {
      const result = err(3).andThen(() => err('should not happen'))
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBe(3)
    })

    it('keeps the original error type even when the callback returns a different one', () => {
      const result = err('original').andThen((value) => err(new Error('ignored')))
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBe('original')
    })
  })

  describe('chaining', () => {
    const sq = (n: number): Result<number, number> => ok(n ** 2)

    it('chains successive Ok results', () => {
      const result = ok(2).andThen(sq).andThen(sq)
      expect(result).toBeInstanceOf(Result)
      expect(result.isOk()).toBe(true)
      expect(result.ok()).toBe(16)
    })

    it('stops when a callback returns an Err', () => {
      const result = ok(2).andThen(sq).andThen(err)
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBe(4)
    })

    it('stops when the first step returns an Err', () => {
      const result = ok(2).andThen(err).andThen(sq)
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBe(2)
    })

    it('short-circuits from an initial Err', () => {
      const result = err(3).andThen(sq).andThen(sq)
      expect(result).toBeInstanceOf(Result)
      expect(result.isErr()).toBe(true)
      expect(result.err()).toBe(3)
    })
  })
})
