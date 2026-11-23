import { describe, it, expect, vi } from 'vitest'
import { Ok, Err } from '../../../src'

describe('Result#map', () => {
  describe('Ok#map', () => {
    it('applies the function to the value and returns Ok', () => {
      expect(Ok(1).map((n) => n + 1)).toEqual(Ok(2))
    })

    it('passes the value to the function', () => {
      const spy = vi.fn((n) => n * 2)
      expect(Ok(5).map(spy)).toEqual(Ok(10))
      expect(spy).toHaveBeenCalledWith(5)
    })

    it('returns Ok when the function returns the same value', () => {
      expect(Ok('a').map((x) => x)).toEqual(Ok('a'))
    })

    it('preserves Ok when the function returns null', () => {
      expect(Ok(1).map(() => null)).toEqual(Ok(null))
    })

    it('preserves Ok when the function returns undefined', () => {
      expect(Ok(1).map(() => undefined)).toEqual(Ok(undefined))
    })

    it('works with boundary values', () => {
      expect(Ok(0).map((n) => n)).toEqual(Ok(0))
      expect(Ok(-1).map((n) => n)).toEqual(Ok(-1))
      expect(Ok('').map((s) => s)).toEqual(Ok(''))
      expect(Ok(true).map((b) => b)).toEqual(Ok(true))
      expect(Ok([]).map((a) => a)).toEqual(Ok([]))
      expect(Ok({}).map((o) => o)).toEqual(Ok({}))
    })

    it('transforms to a different type', () => {
      expect(Ok(3).map((n) => n.toString())).toEqual(Ok('3'))
    })

    it('rejects when the function throws', async () => {
      const spy = vi.fn(() => {
        throw new Error('boom')
      })
      await expect(Ok(1).map(spy)).rejects.toThrow('boom')
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('rejects when the identity function throws', async () => {
      const spy = vi.fn(() => {
        throw new Error('identity boom')
      })
      await expect(Ok(42).map(spy)).rejects.toThrow('identity boom')
    })

    it('still rejects when the value itself is null', async () => {
      const spy = vi.fn(() => {
        throw new Error('boundary boom')
      })
      await expect(Ok(null).map(spy)).rejects.toThrow('boundary boom')
    })
  })

  describe('Err#map', () => {
    it('ignores the function and returns the same error', () => {
      expect(Err('e').map((x) => x + 1)).toEqual(Err('e'))
    })

    it('returns the same error for an identity function', () => {
      expect(Err(0).map((x) => x)).toEqual(Err(0))
    })

    it('returns the same error when the function returns null', () => {
      expect(Err('e').map(() => null)).toEqual(Err('e'))
    })

    it('returns the same error when the function returns undefined', () => {
      expect(Err('e').map(() => undefined)).toEqual(Err('e'))
    })

    it('works with boundary errors', () => {
      expect(Err(0).map((x) => x)).toEqual(Err(0))
      expect(Err([]).map((x) => x)).toEqual(Err([]))
      expect(Err(null).map((x) => x)).toEqual(Err(null))
    })

    it('never invokes the function', () => {
      const spy = vi.fn(() => {
        throw new Error('should not run')
      })
      expect(Err('e').map(spy)).toEqual(Err('e'))
      expect(spy).not.toHaveBeenCalled()
    })
  })
})
