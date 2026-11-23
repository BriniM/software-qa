import { describe, it, expect } from 'vitest'
import { Ok, Err } from '../../../src'

describe('mapErr', () => {
  describe('Ok#mapErr', () => {
    it('preserves the value and keeps Ok', () => {
      const ok = Ok(42, new Error('no error here'))
      const result = ok.mapErr((_err) => new Error('ignored'))
      expect(result).toEqual(ok)
    })

    it('does not invoke the mapper function', () => {
      const ok = Ok('value', new Error('err'))
      let called = false
      const result = ok.mapErr((_err) => {
        called = true
        return new Error('never')
      })
      expect(result).toEqual(ok)
      expect(called).toBe(false)
    })
  })

  describe('Err#mapErr', () => {
    it('transforms the error and preserves the value', () => {
      const err = Err(new Error('boom'), 42)
      const result = err.mapErr((e) => e.message.toUpperCase())
      expect(result).toEqual(Err(new Error('BOOM'), 42))
    })

    it('passes the original error to the mapper', () => {
      const err = Err('original', 1)
      let received: unknown
      const result = err.mapErr((e) => {
        received = e
        return e
      })
      expect(result).toEqual(Err('original', 1))
      expect(received).toBe('original')
    })

    it('propagates errors thrown by the mapper', () => {
      const err = Err('boom', 1)
      expect(() => err.mapErr(() => {
        throw new Error('mapper failed')
      })).toThrow('mapper failed')
    })
  })
})
