import { describe, it, expect, vi } from 'vitest'
import { Ok, Err } from '../../../src'

describe('unwrapOr', () => {
  it('Ok#unwrapOr returns the internal value', () => {
    const result = Ok('a')
    expect(result.unwrapOr('b')).toBe('a')
  })

  it('Ok#unwrapOr ignores the provided default argument', () => {
    const result = Ok(42)
    expect(result.unwrapOr(0)).toBe(42)
  })

  it('Ok#unwrapOr ignores the provided default when it differs from the value', () => {
    const result = Ok({ id: 1 })
    expect(result.unwrapOr({ id: 2 })).toEqual({ id: 1 })
  })

  it('Err#unwrapOr returns the provided value', () => {
    const result = Err('boom')
    expect(result.unwrapOr('default')).toBe('default')
  })

  it('Err#unwrapOr returns the last provided value', () => {
    const result = Err('boom')
    expect(result.unwrapOr('first')).toBe('first')
    expect(result.unwrapOr('second')).toBe('second')
  })

  it('Err#unwrapOr returns the provided value when it is falsy', () => {
    const result = Err('boom')
    expect(result.unwrapOr(0)).toBe(0)
    expect(result.unwrapOr('')).toBe('')
  })

  it('Err#unwrapOr returns the provided value when it is null or undefined', () => {
    const result = Err('boom')
    expect(result.unwrapOr(null)).toBe(null)
    expect(result.unwrapOr(undefined)).toBe(undefined)
  })

  it('Ok#unwrapOr returns the internal value when the provided argument is falsy', () => {
    const result = Ok(null)
    expect(result.unwrapOr(undefined)).toBe(null)
  })
})
