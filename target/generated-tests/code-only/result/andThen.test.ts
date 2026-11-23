import { describe, it, expect, vi } from 'vitest'
import { Ok, Err, ok, err } from '../../../src'

describe('Result#andThen', () => {
  describe('Ok#andThen', () => {
    it('applies the function to the value and returns the Ok result', () => {
      const result = ok(1).andThen((x) => ok(x + 1))
      expect((result as Ok<number>).value).toBe(2)
    })

    it('passes the raw value to the function exactly once', () => {
      const spy = vi.fn<(x: number) => Ok<number>>()
      ok(1).andThen(spy)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(1)
    })

    it('short-circuits when the function returns an Err', () => {
      const result = ok('hello').andThen(() => err('boom'))
      expect((result as Err<string>).error).toBe('boom')
    })

    it('propagates an Err returned by the function', () => {
      const result = ok(5).andThen((x) => {
        expect(x).toBe(5)
        return err('bad')
      })
      expect((result as Err<string>).error).toBe('bad')
    })

    it('supports a function returning a different Ok type', () => {
      const result = ok('foo').andThen((x) => ok(x.length))
      expect((result as Ok<number>).value).toBe(3)
    })
  })

  describe('Err#andThen', () => {
    it('ignores the function argument and returns the same error', () => {
      const result = err('boom').andThen((x) => ok(x + 1))
      expect((result as Err<string>).error).toBe('boom')
    })

    it('does not invoke the function', () => {
      const spy = vi.fn<(x: number) => Ok<number>>()
      err('boom').andThen(spy)
      expect(spy).not.toHaveBeenCalled()
    })

    it('preserves the original error value by reference', () => {
      const original = new Error('original')
      const result = err(original).andThen((x) => ok(x * 2))
      expect((result as Err<Error>).error).toBe(original)
    })

    it('works with an identity function', () => {
      const result = err('boom').andThen((x) => x)
      expect((result as Err<string>).error).toBe('boom')
    })
  })
})
