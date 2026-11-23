import { describe, it, expect, vi } from 'vitest'
import { ok, err } from '../../../src'

describe('ok().orTee', () => {
  it('returns the ok value and does not invoke the handler', () => {
    const handler = vi.fn()
    const result = ok(1)
    const returned = result.orTee(handler)
    expect(handler).not.toHaveBeenCalled()
    expect(returned).toEqual({ value: 1 })
  })

  it('ignores the handler for falsy ok values', () => {
    const handler = vi.fn()
    const result = ok(0)
    result.orTee(handler)
    expect(result.orTee(handler)).toEqual({ value: 0 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('still returns ok when the handler throws', () => {
    const result = ok('ok')
    const handler = vi.fn(() => { throw new Error('boom') })
    expect(result.orTee(handler)).toEqual({ value: 'ok' })
    expect(handler).toHaveBeenCalled()
  })
})

describe('err().orTee', () => {
  it('invokes the handler with the error and returns the err', () => {
    const error = new Error('bad')
    const handler = vi.fn()
    const result = err(error)
    const returned = result.orTee(handler)
    expect(handler).toHaveBeenCalledWith(error)
    expect(returned).toEqual({ error })
  })

  it('swallows errors thrown by the handler', () => {
    const result = err('boom')
    const handler = vi.fn(() => { throw new Error('inner') })
    expect(() => result.orTee(handler)).not.toThrow()
    expect(handler).toHaveBeenCalled()
  })

  it('supports null and undefined errors', () => {
    const handler = vi.fn()
    expect(err(null).orTee(handler)).toEqual({ error: null })
    expect(err(undefined).orTee(handler)).toEqual({ error: undefined })
  })
})
