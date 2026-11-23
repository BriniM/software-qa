import { describe, it, expect, vi } from 'vitest'
import { ok, err, Result } from '../../../src'

enum DatabaseError {
  PoolExhausted = 'PoolExhausted',
  NotFound = 'NotFound',
}

describe('Result.orElse', () => {
  it('Ok#orElse returns the ok value unchanged', () => {
    const result = ok<string, number>(42)
    const output = result.orElse((e) => err(e))
    expect(output).toEqual(ok(42))
  })

  it('Ok#orElse ignores the callback argument entirely', () => {
    const result = ok<string, string>('value')
    const spy = vi.fn()
    const output = result.orElse(spy)
    expect(output).toEqual(ok('value'))
    expect(spy).not.toHaveBeenCalled()
  })

  it('Err#orElse applies the callback to the error value', () => {
    const result = err<string, string>('fail')
    const output = result.orElse((e) => ok(`recovered: ${e}`))
    expect(output).toEqual(ok('recovered: fail'))
  })

  it('Err#orElse callback receives the exact error value', () => {
    const result = err<string, string>('boom')
    const received: string[] = []
    const output = result.orElse((e) => {
      received.push(e)
      return ok('ok')
    })
    expect(output).toEqual(ok('ok'))
    expect(received).toEqual(['boom'])
  })

  it('Err#orElse can recover to an ok value', () => {
    const result = err<string, string>('fail')
    const output = result.orElse(() => ok('recovered'))
    expect(output).toEqual(ok('recovered'))
  })

  it('Err#orElse can recover to an ok value with an empty string', () => {
    const result = err<string, string>('fail')
    const output = result.orElse(() => ok(''))
    expect(output).toEqual(ok(''))
  })

  it('Err#orElse can transform the error into a different type', () => {
    const result = err<string, DatabaseError>(DatabaseError.NotFound)
    const output = result.orElse((dbError) =>
      dbError === DatabaseError.NotFound
        ? ok('User does not exist')
        : err(500)
    )
    expect(output).toEqual(ok('User does not exist'))
  })

  it('Err#orElse can fall back to an error of a new type', () => {
    const result = err<string, DatabaseError>(DatabaseError.PoolExhausted)
    const output = result.orElse(() => err(500))
    expect(output).toEqual(err(500))
  })

  it('Err#orElse can keep the same error value', () => {
    const result = err<string, DatabaseError>(DatabaseError.NotFound)
    const output = result.orElse((e) => err(e))
    expect(output).toEqual(err(DatabaseError.NotFound))
  })

  it('Ok#orElse preserves the original value type', () => {
    const result = ok<string, DatabaseError>('hello')
    const output = result.orElse(() => err('new-error'))
    expect(output).toEqual(ok('hello'))
    expect(output.value).toBe('hello')
  })

  it('Ok#orElse returns a Result instance', () => {
    const result = ok<string, number>(1)
    const output = result.orElse((e) => err(e))
    expect(output).toBeInstanceOf(Result)
  })

  it('Err#orElse with a throwing callback rejects the promise', async () => {
    const result = err<string, string>('fail')
    const spy = vi.fn().mockImplementation(() => {
      throw new Error('boom')
    })
    await expect(result.orElse(spy)).rejects.toThrow('boom')
  })

  it('Err#orElse with a throwing callback preserves the original error value', async () => {
    const result = err<string, string>('original')
    const spy = vi.fn().mockImplementation(() => {
      throw new Error('boom')
    })
    await expect(result.orElse(spy)).rejects.toThrow('boom')
  })
})
