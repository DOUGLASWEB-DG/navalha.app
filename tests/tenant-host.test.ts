import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getFixedSubdomain, getTenantRootDomain, normalizeHost, parseTenantHost } from '../lib/tenant-host'

const sub = (subdomain: string) => ({ kind: 'subdomain', subdomain })
const custom = (domain: string) => ({ kind: 'customDomain', domain })
const none = (reason: string) => ({ kind: 'none', reason })

test('hosts com a plataforma em navalha.app', () => {
  const root = 'navalha.app'
  const cases: [string | null, object][] = [
    ['america.navalha.app', sub('america')],
    ['AMERICA.NAVALHA.APP', sub('america')],
    ['america.navalha.app.', sub('america')],
    ['america.navalha.app:443', sub('america')],
    [' America.Navalha.App.:8080 ', sub('america')],
    ['navalha.app', none('platform-root')],
    ['navalha.app.', none('platform-root')],
    ['www.navalha.app', none('reserved')],
    ['api.navalha.app', none('reserved')],
    ['a.b.navalha.app', none('nested')],
    ['-america.navalha.app', none('invalid')],
    ['america..navalha.app', none('invalid')],
    ['america.navalha.app.evil.com', custom('america.navalha.app.evil.com')],
    ['evilnavalha.app', custom('evilnavalha.app')],
    ['americabarbearia.tech', custom('americabarbearia.tech')],
    ['AmericaBarbearia.TECH.:443', custom('americabarbearia.tech')],
    ['127.0.0.1:3000', none('ip')],
    ['[::1]:3000', none('invalid')],
    ['localhost:3000', none('invalid')],
    ['america.navalha.app:abc', none('invalid')],
    ['', none('invalid')],
    [null, none('invalid')],
  ]
  for (const [host, expected] of cases) {
    assert.deepEqual(parseTenantHost(host, root), expected, `host=${JSON.stringify(host)}`)
  }
})

test('hosts em desenvolvimento (localhost)', () => {
  const root = 'localhost'
  assert.deepEqual(parseTenantHost('america.localhost:3000', root), sub('america'))
  assert.deepEqual(parseTenantHost('localhost:3000', root), none('platform-root'))
  assert.deepEqual(parseTenantHost('x.y.localhost', root), none('nested'))
})

test('sem domínio da plataforma (produção sem TENANT_ROOT_DOMAIN): só domínio próprio', () => {
  assert.deepEqual(parseTenantHost('america.navalha.app', null), custom('america.navalha.app'))
  assert.deepEqual(parseTenantHost('americabarbearia.tech', null), custom('americabarbearia.tech'))
})

test('normalizeHost', () => {
  assert.equal(normalizeHost('Foo.Example.COM.:8080'), 'foo.example.com')
  assert.equal(normalizeHost('foo_bar.example.com'), null)
  assert.equal(normalizeHost('a'.repeat(64) + '.com'), null)
})

test('domínio raiz por ambiente', () => {
  assert.equal(getTenantRootDomain({ NODE_ENV: 'production' } as NodeJS.ProcessEnv), null)
  assert.equal(getTenantRootDomain({ NODE_ENV: 'production', TENANT_ROOT_DOMAIN: 'Navalha.App.' } as NodeJS.ProcessEnv), 'navalha.app')
  assert.equal(getTenantRootDomain({ NODE_ENV: 'development' } as NodeJS.ProcessEnv), 'localhost')
})

test('tenant fixo só fora de produção', () => {
  const env = (extra: Record<string, string>) => ({ TENANT_FIXED_SUBDOMAIN: 'america', ...extra }) as unknown as NodeJS.ProcessEnv
  const silence = console.error
  console.error = () => {}
  try {
    assert.equal(getFixedSubdomain(env({ NODE_ENV: 'development' })), 'america')
    assert.equal(getFixedSubdomain(env({ NODE_ENV: 'production', VERCEL_ENV: 'preview' })), 'america')
    assert.equal(getFixedSubdomain(env({ NODE_ENV: 'production' })), null)
    assert.equal(getFixedSubdomain(env({ NODE_ENV: 'production', VERCEL_ENV: 'production' })), null)
    assert.equal(getFixedSubdomain(env({ NODE_ENV: 'development', VERCEL_ENV: 'production' })), null)
    assert.equal(getFixedSubdomain({ NODE_ENV: 'development', TENANT_FIXED_SUBDOMAIN: 'www' } as unknown as NodeJS.ProcessEnv), null)
  } finally {
    console.error = silence
  }
})
