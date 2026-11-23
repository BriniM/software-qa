import { describe, it, expect, vi } from 'vitest'
import { Result, ok, err } from '../../../src'

describe('Result.mapErr', () => {
  it('returns a new Ok instance and leaves the value untouched', () => {
    const result = ok(42)
    const mapped = result.mapErr(e => e)
    expect(mapped).not.toBe(result)
    expect(mapped.isOk()).toBe(true)
    expect(mapped.value).toBe(42)
  })

  it('ignores the callback when applied to an Ok result', () => {
    const result = ok(42)
    const spy = vi.fn()
    const mapped = result.mapErr(spy)
    expect(mapped.isOk()).toBe(true)
    expect(mapped.value).toBe(42)
    expect(spy).not.toHaveBeenCalled()
  })

  it('applies the callback to the error of an Err result', () => {
    const result = err('boom')
    const mapped = result.mapErr(e => e.toUpperCase())
    expect(mapped.isErr()).toBe(true)
    expect(mapped.error).toBe('BOOM')
  })

  it('creates a new Err instance even with an identity callback', () => {
    const result = err('boom')
    const mapped = result.mapErr(e => e)
    expect(mapped).not.toBe(result)
    expect(mapped.isErr()).toBe(true)
    expect(mapped.error).toBe('boom')
  })

  it('changes the error type', () => {
    const result = err('boom')
    const mapped = result.mapErr(e => e.length)
    expect(mapped.isErr()).toBe(true)
    expect(mapped.error).toBe(5)
  })

  it('handles boundary error values', () => {
    const empty = err('')
    const mapped = empty.mapErr(e => e.length)
    expect(mapped.isErr()).toBe(true)
    expect(mapped.error).toBe(0)

    const zero = err(0)
    const mapped2 = zero.mapErr(e => e + 1)
    expect(mapped2.isErr()).toBe(true)
    expect(mapped2.error).toBe(1)
  })

  it('transforms an error into a response body (README example)', () => {
    const result = err('nonsensical gibberish and badly formatted stuff')
    const mapped = result.mapErr(e => ({ error: e }))
    expect(mapped.isErr()).toBe(true)
    expect(mapped.error).toEqual({ error: 'nonsensical gibberish and badly formatted stuff' })
  })

  it('works with a typed Result', () => {
    const result: Result<string, Error> = err(new Error('boom'))
    const mapped = result.mapErr(e => e.message)
    expect(mapped.isErr()).toBe(true)
    expect(mapped.error).toBe('boom')
  })
})
