import { describe, it, expect, vi } from 'vitest'
import { Result, ok, err } from '../../../src'

describe('Result.andTee', () => {
  describe('Ok#andTee', () => {
    it('invokes the callback with the value', () => {
      const value = 42
      const spy = vi.fn()
      ok(value).andTee(spy)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(value)
    })

    it('returns a new Ok instance carrying the same value', () => {
      const value = 7
      const result = ok(value)
      const output = result.andTee(() => undefined)
      expect(output).not.toBe(result)
      expect(output).toBeInstanceOf(Result)
      expect(output.isOk()).toBe(true)
      expect(output.value).toBe(value)
    })

    it('ignores the callback return value', () => {
      const value = 7
      const output = ok(value).andTee(() => 'ignored')
      expect(output.value).toBe(value)
    })

    it('swallows errors thrown by the callback', () => {
      const value = 7
      const spy = vi.fn(() => {
        throw new Error('boom')
      })
      const output = ok(value).andTee(spy)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(output.isOk()).toBe(true)
      expect(output.value).toBe(value)
    })

    it('preserves falsy values', () => {
      expect(ok(0).andTee(() => undefined).value).toBe(0)
      expect(ok('').andTee(() => undefined).value).toBe('')
      expect(ok(false).andTee(() => undefined).value).toBe(false)
      expect(ok(null).andTee(() => undefined).value).toBe(null)
    })
  })

  describe('Err#andTee', () => {
    it('does not invoke the callback', () => {
      const spy = vi.fn()
      err(new Error('bad')).andTee(spy)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a new Err instance carrying the same error', () => {
      const error = new Error('bad')
      const result = err(error)
      const output = result.andTee(() => undefined)
      expect(output).not.toBe(result)
      expect(output).toBeInstanceOf(Result)
      expect(output.isErr()).toBe(true)
      expect(output.error).toBe(error)
    })

    it('preserves the error type', () => {
      const error = new TypeError('typed')
      const output = err(error).andTee(() => undefined)
      expect(output.isErr()).toBe(true)
      expect(output.error).toBeInstanceOf(TypeError)
    })
  })
})
