import { describe, it, expect } from 'vitest'
import { Result } from '../../../src'

describe('Result.map', () => {
  it('maps an Ok value with the callback', () => {
    const result = Result.ok(5).map((value) => value + 1)
    expect(result.isOk()).toBe(true)
    expect(result.value).toBe(6)
  })

  it('does not invoke the callback for an Err', () => {
    const error = new Error('boom')
    let invoked = false
    const result = Result.err(error).map(() => {
      invoked = true
      return 'unreachable'
    })
    expect(result.isErr()).toBe(true)
    expect(result.error).toBe(error)
    expect(invoked).toBe(false)
  })

  it('returns the original Err unchanged', () => {
    const error = new Error('boom')
    const result = Result.err(error).map((value) => value.toUpperCase())
    expect(result.isErr()).toBe(true)
    expect(result.error).toBe(error)
  })

  it('maps boundary Ok values', () => {
    expect(Result.ok(0).map((value) => value * 2).value).toBe(0)
    expect(Result.ok('').map((value) => value.length).value).toBe(0)
    expect(Result.ok(false).map((value) => !value).value).toBe(true)
  })

  it('composes with chained maps on Ok', () => {
    const result = Result.ok(1).map((value) => value + 1).map((value) => value * 2)
    expect(result.isOk()).toBe(true)
    expect(result.value).toBe(4)
  })

  it('carries the Err through chained maps', () => {
    const error = new Error('boom')
    const result = Result.err(error).map((value) => value + 1).map((value) => value * 2)
    expect(result.isErr()).toBe(true)
    expect(result.error).toBe(error)
  })

  it('maps to a different type', () => {
    const result = Result.ok('42').map(Number)
    expect(result.isOk()).toBe(true)
    expect(result.value).toBe(42)
    expect(typeof result.value).toBe('number')
  })

  it('produces a fresh instance without mutating the original', () => {
    const original = Result.ok(1)
    const mapped = Result.ok(1).map((value) => value + 1)
    expect(mapped).not.toBe(original)
    expect(original.value).toBe(1)
  })
})
