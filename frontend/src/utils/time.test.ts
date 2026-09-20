import { describe, expect, it } from 'vitest'
import { formatDate, isEdited, timeAgo } from './time'

describe('timeAgo', () => {
  const now = new Date('2026-09-20T12:00:00Z')

  it('formats minutes, hours, days, months and years', () => {
    expect(timeAgo('2026-09-20T11:59:00Z', now)).toContain('minute')
    expect(timeAgo('2026-09-20T09:00:00Z', now)).toContain('hour')
    expect(timeAgo('2026-09-15T12:00:00Z', now)).toContain('day')
    expect(timeAgo('2026-07-20T12:00:00Z', now)).toContain('month')
    expect(timeAgo('2024-09-20T12:00:00Z', now)).toContain('year')
  })

  it('treats very recent reviews as just now', () => {
    expect(timeAgo('2026-09-20T11:59:59Z', now)).toBe('just now')
  })

  it('is plural-aware', () => {
    expect(timeAgo('2026-09-20T11:00:00Z', now)).toBe('1 hour ago')
  })
})

describe('formatDate', () => {
  it('formats to a readable date string', () => {
    expect(formatDate('2026-03-05T12:00:00Z')).toMatch(/5 Mar 2026/)
  })
})

describe('isEdited', () => {
  it('flags reviews whose updatedAt differs from createdAt by more than a minute', () => {
    expect(
      isEdited({
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:05:00Z',
      }),
    ).toBe(true)
    expect(
      isEdited({
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
      }),
    ).toBe(false)
  })
})