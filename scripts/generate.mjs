#!/usr/bin/env node
/**
 * Generate unit tests by introspecting the neverthrow modules at runtime.
 *
 * For each configured production file we:
 *   1. bundle it to ESM with esbuild (so Node can resolve TS + directory imports),
 *   2. import it and enumerate its public functions / class methods / namespace statics,
 *   3. take each method's source with Function.prototype.toString(),
 *   4. ask the local Ornith model for a Vitest test file for that single method,
 *   5. save the result under target/generated-tests/<variant>/<file>/<method>.test.ts.
 *
 * LLM settings are intentionally minimal: model, messages, max_tokens, stream only.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '..')
const TARGET = path.join(ROOT, 'target')
const requireFromTarget = createRequire(path.join(TARGET, 'package.json'))
const esbuild = requireFromTarget('esbuild')
const ts = requireFromTarget('typescript')

const ENDPOINT = process.env.ORNITH_ENDPOINT ?? 'http://localhost:8080/v1/chat/completions'
const MODEL = process.env.ORNITH_MODEL ?? 'ornith-1.5-9b'
const VARIANTS = ['code-only', 'code-plus-spec']
const MAX_TOKENS = 32768

const FILES = [
  {
    id: 'result',
    source: 'src/result.ts',
    methods: ['ok', 'err', 'safeTry', 'fromThrowable', 'combine', 'combineWithAllErrors',
      'isOk', 'isErr', 'map', 'mapErr', 'unwrapOr', 'andThen', 'orElse', 'match',
      'andTee', 'orTee', 'andThrough', 'safeUnwrap'],
  },
  {
    id: 'result-async',
    source: 'src/result-async.ts',
    methods: ['okAsync', 'errAsync', 'fromPromise', 'fromSafePromise', 'fromThrowable',
      'map', 'mapErr', 'andThen', 'orElse', 'match', 'combine', 'combineWithAllErrors'],
  },
  {
    id: 'utils',
    source: 'src/_internals/utils.ts',
    methods: ['combineResultList', 'combineResultListWithAllErrors', 'combineResultAsyncList'],
  },
  {
    id: 'error',
    source: 'src/_internals/error.ts',
    methods: ['createNeverThrowError'],
  },
]

const SYSTEM_PROMPT = `You are an expert TypeScript test engineer. Output only raw TypeScript source for a single Vitest test file. No prose, no markdown fences outside the code block.
Use Vitest 2.x (import { describe, it, expect, vi } from 'vitest'). Use only vi for mocking.
Import the API under test from '../../../src' (public entry point) or from the exact source path given.
Test only the named method: success paths, error paths, boundary values and relevant edge cases for Ok/Err (or resolved/rejected) states.
Assert observable behavior. Keep tests deterministic, independent, and await all async work.`

function log(line) {
  console.log(line)
  fs.appendFile(path.join(ROOT, 'generation.log'), `${new Date().toISOString()} ${line}\n`, 'utf8').catch(() => {})
}

function isClass(fn) {
  return /^class\s/.test(Function.prototype.toString.call(fn))
}

/** Walk a bundled module's exports and collect one entry per allowed method name. */
function collectMethods(mod, fileConfig) {
  const allowed = new Set(fileConfig.methods)
  const found = new Map()

  const add = (name, owner, fn) => {
    if (!allowed.has(name) || typeof fn !== 'function') return
    if (!found.has(name)) found.set(name, { name, sources: [] })
    const code = Function.prototype.toString.call(fn)
    if (!found.get(name).sources.some((s) => s.code === code)) {
      found.get(name).sources.push({ owner, code })
    }
  }

  for (const [exportName, value] of Object.entries(mod)) {
    if (typeof value === 'function') {
      if (isClass(value)) {
        for (const key of Object.getOwnPropertyNames(value.prototype)) {
          if (key !== 'constructor' && !key.startsWith('_')) add(key, `${exportName}#${key}`, value.prototype[key])
        }
        for (const key of Object.getOwnPropertyNames(value)) {
          if (!['length', 'name', 'prototype', 'arguments', 'caller'].includes(key)) add(key, `${exportName}.${key}`, value[key])
        }
      } else {
        add(exportName, exportName, value)
      }
    } else if (value && typeof value === 'object') {
      for (const [key, fn] of Object.entries(value)) {
        if (typeof fn === 'function') add(key, `${exportName}.${key}`, fn)
      }
    }
  }
  return [...found.values()]
}

/** Bundle one TS source file to a temporary ESM module and import it. */
async function importSource(fileConfig, tmpDir) {
  const result = await esbuild.build({
    entryPoints: [path.join(TARGET, fileConfig.source)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'esnext',
    write: false,
    logLevel: 'silent',
  })
  const outFile = path.join(tmpDir, `${fileConfig.id}.mjs`)
  await fs.writeFile(outFile, result.outputFiles[0].contents, 'utf8')
  return import(pathToFileURL(outFile).href + `?v=${Date.now()}`)
}

/** Build a README-section lookup keyed by method name. */
async function readSpecLookup() {
  const lines = (await fs.readFile(path.join(TARGET, 'README.md'), 'utf8')).split('\n')
  const sections = []
  let current = null
  for (let i = 0; i < lines.length; i++) {
    if (/^####\s/.test(lines[i])) {
      if (current) current.end = i - 1
      current = { heading: lines[i], start: i }
      sections.push(current)
    }
  }
  if (current) current.end = lines.length - 1
  const general = lines.slice(101, 140).join('\n') // Top-Level API
  return (fileId, name) => {
    const range = fileId === 'result' ? [140, 864]
      : fileId === 'result-async' ? [864, 1520]
        : fileId === 'utils' ? [762, 1510]
          : [1630, 1674]
    const match = sections.find(
      (s) => s.start >= range[0] && s.start <= range[1] && s.heading.toLowerCase().includes(name.toLowerCase()),
    )
    return match ? lines.slice(match.start, match.end + 1).join('\n') : general
  }
}

function extractCode(text) {
  const fenced = text.trim().match(/```(?:typescript|ts|js|javascript)?\s*\n([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim() + '\n'
  const s = text.trim()
  const idx = s.search(/^(import|const|let|var|describe)\b/m)
  return (idx > 0 ? s.slice(idx) : s).trim() + '\n'
}

function parses(code) {
  return ts.createSourceFile('generated.ts', code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS).parseDiagnostics.length === 0
}

async function streamCompletion(prompt, label, budget) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: budget,
      stream: true,
    }),
    signal: AbortSignal.timeout(20 * 60 * 1000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  if (!res.body) throw new Error('no response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let lastReport = Date.now()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const text = line.trim()
      if (!text.startsWith('data:')) continue
      const data = text.slice(5).trim()
      if (data === '[DONE]') continue
      let chunk
      try { chunk = JSON.parse(data) } catch { continue }
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) answer += delta
      if (Date.now() - lastReport > 90_000) {
        lastReport = Date.now()
        log(`  [${label}] streaming: ${answer.length} answer chars`)
      }
    }
  }
  return answer
}

async function generateOne(prompt, label, outFile) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const budget = attempt === 1 ? MAX_TOKENS : 49152
    try {
      const answer = await streamCompletion(prompt, label, budget)
      const code = extractCode(answer)
      if (!answer.trim()) throw new Error('empty answer')
      if (!parses(code)) throw new Error(`parse failed (${code.split('\n').length} lines)`)
      await fs.mkdir(path.dirname(outFile), { recursive: true })
      await fs.writeFile(outFile, code, 'utf8')
      return { ok: true, attempt, budget, lines: code.split('\n').length }
    } catch (err) {
      log(`  [${label}] attempt ${attempt} (${budget}) failed: ${err.message}`)
    }
  }
  return { ok: false }
}

async function main() {
  const specLookup = await readSpecLookup()
  const tmpDir = path.join(TARGET, '.gen-tmp')
  await fs.mkdir(tmpDir, { recursive: true })

  for (const fileConfig of FILES) {
    const mod = await importSource(fileConfig, tmpDir)
    const methods = collectMethods(mod, fileConfig)
    log(`${fileConfig.source}: ${methods.length}/${fileConfig.methods.length} allowed methods found`)

    if (process.env.INTROSPECT_ONLY) {
      for (const m of methods) log(`  ${m.name} <- ${m.sources.map((s) => s.owner).join(', ')}`)
      continue
    }

    for (const method of methods) {
      if (process.env.ONLY_METHOD && method.name !== process.env.ONLY_METHOD) continue
      const sourceText = method.sources.map((s) => `// ${s.owner}\n${s.code}`).join('\n\n')
      for (const variant of VARIANTS) {
        const label = `${variant}/${fileConfig.id}/${method.name}`
        const outFile = path.join(TARGET, 'generated-tests', variant, fileConfig.id, `${method.name}.test.ts`)
        try {
          if (parses(await fs.readFile(outFile, 'utf8'))) {
            log(`Skipping ${label} (exists)`)
            continue
          }
        } catch {
          // not generated yet
        }

        const parts = [
          `Production file: ${fileConfig.source}`,
          `Method: ${method.name}`,
          '',
          'RUNTIME SOURCE (obtained via Function.prototype.toString()):',
          '```ts',
          sourceText,
          '```',
          '',
          'Public entry point is importable from "../../../src".',
          `Write one complete Vitest test file for ${method.name}.`,
        ]
        if (variant === 'code-plus-spec') {
          parts.push('', 'REQUIREMENTS (README excerpt):', '```markdown', specLookup(fileConfig.id, method.name), '```')
        }
        log(`Generating ${label} ...`)
        const r = await generateOne(parts.join('\n'), label, outFile)
        log(r.ok ? `  -> ${path.relative(TARGET, outFile)} (${r.lines} lines, attempt ${r.attempt})` : `  !! FAILED ${label}`)
      }
    }
  }

  await fs.rm(tmpDir, { recursive: true, force: true })
  log('Done.')
}

main().catch((err) => {
  log(`FATAL: ${err.stack ?? err}`)
  process.exit(1)
})
