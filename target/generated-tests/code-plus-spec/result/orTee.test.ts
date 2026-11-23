import { describe, it, expect, vi } from 'vitest'
import { Result } from '../../../src'

describe('Result.orTee', () => {
  describe('Ok', () => {
    it('returns a new Ok containing the same value', () => {
      const ok = new Result.Ok<string, string>('value')
      const result = ok.orTee(() => 'ignored')
      expect(result).toBeInstanceOf(Result.Ok)
      expect(result.value).toBe('value')
    })

    it('does not invoke the callback', () => {
      const ok = new Result.Ok<string, string>('value')
      const spy = vi.fn()
      ok.orTee(spy)
      expect(spy).not.toHaveBeenCalled()
    })

    it('ignores the callback entirely and returns the original value', () => {
      const ok = new Result.Ok<string, string>('value')
      const result = ok.orTee(() => {
        throw new Error('kaboom')
      })
      expect(result).toBeInstanceOf(Result.Ok)
      expect(result.value).toBe('value')
    })
  })

  describe('Err', () => {
    it('invokes the callback with the error value', () => {
      const err = new Result.Err<string, number>('boom')
      const spy = vi.fn()
      err.orTee(spy)
      expect(spy).toHaveBeenCalledWith('boom')
    })

    it('returns a new Err containing the same error', () => {
      const err = new Result.Err<string, number>('boom')
      const result = err.orTee(() => 'ignored')
      expect(result).toBeInstanceOf(Result.Err)
      expect(result.error).toBe('boom')
    })

    it('ignores the callback return value', () => {
      const err = new Result.Err<string, number>('boom')
      const result = err.orTee(() => 'some result')
      expect(result).toBeInstanceOf(Result.Err)
      expect(result.error).toBe('boom')
    })

    it('swallows exceptions thrown by the callback', () => {
      const err = new Result.Err<string, number>('boom')
      const spy = vi.fn(() => {
        throw new Error('kaboom')
      })
      const result = err.orTee(spy)
      expect(result).toBeInstanceOf(Result.Err)
      expect(result.error).toBe('boom')
      expect(spy).toHaveBeenCalled()
    })
  })
})
