import { describe, it, expect, vi } from 'vitest'
import { ok, err } from '../../../src'

describe('Result.andTee', () => {
  it('invokes the callback with the Ok value and passes the value through', () => {
    const original = ok<string, string>('hello')
    const spy = vi.fn()
    const result = original.andTee(spy)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('hello')
    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    if (result.isOk()) {
      expect(result.value).toBe('hello')
    }
  })

  it('ignores the callback return value and keeps the original value', () => {
    const original = ok<number, string>(42)
    const spy = vi.fn(() => 'ignored')
    const result = original.andTee(spy)

    expect(spy).toHaveBeenCalledWith(42)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe(42)
    }
  })

  it('swallows errors thrown by the callback and still passes the Ok value through', () => {
    const original = ok<string, string>('value')
    const spy = vi.fn(() => { throw new Error('boom') })
    const result = original.andTee(spy)

    expect(spy).toHaveBeenCalled()
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('value')
    }
  })

  it('handles boundary Ok values (zero and empty string)', () => {
    const spy = vi.fn()

    const numeric = ok<number, string>(0).andTee(spy)
    expect(spy).toHaveBeenCalledWith(0)
    expect(numeric.isOk()).toBe(true)
    if (numeric.isOk()) {
      expect(numeric.value).toBe(0)
    }

    const empty = ok<string, string>('').andTee(spy)
    expect(spy).toHaveBeenCalledWith('')
    expect(empty.isOk()).toBe(true)
    if (empty.isOk()) {
      expect(empty.value).toBe('')
    }
  })

  it('does not invoke the callback for an Err result', () => {
    const original = err<string, string>('error')
    const spy = vi.fn()
    const result = original.andTee(spy)

    expect(spy).not.toHaveBeenCalled()
    expect(result.isErr()).toBe(true)
    expect(result.isOk()).toBe(false)
    if (result.isErr()) {
      expect(result.error).toBe('error')
    }
  })

  it('passes the Err error through even when a callback is provided', () => {
    const original = err<string, string>('error')
    const spy = vi.fn(() => 'should not be called')
    const result = original.andTee(spy)

    expect(spy).not.toHaveBeenCalled()
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error).toBe('error')
    }
  })
})
