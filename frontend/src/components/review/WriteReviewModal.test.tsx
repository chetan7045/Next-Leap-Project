import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WriteReviewModal } from './WriteReviewModal'

vi.mock('../../services/reviewApi', () => ({
  reviewApi: { create: vi.fn() },
}))

import { reviewApi } from '../../services/reviewApi'

const createMock = vi.mocked(reviewApi.create)

function setup(overrides: { onSubmitted?: () => void } = {}) {
  const onClose = vi.fn()
  const onSubmitted = overrides.onSubmitted ?? vi.fn()
  render(
    <WriteReviewModal
      restaurantId="rest-1"
      restaurantName="HOPS Mumbai"
      onClose={onClose}
      onSubmitted={onSubmitted}
    />,
  )
  return { onClose, onSubmitted }
}

describe('WriteReviewModal validation', () => {
  it('requires a rating before submitting', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Submit Review/i }))
    expect(screen.getByText('Please select a rating.')).toBeInTheDocument()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects a review shorter than 10 characters', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('radio', { name: 'Rate 5 stars' }))
    await user.type(screen.getByLabelText(/Tell us about your experience/), 'too short')
    await user.click(screen.getByRole('button', { name: /Submit Review/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'at least 10 characters',
    )
    expect(createMock).not.toHaveBeenCalled()
  })

  it('submits valid input and notifies the parent', async () => {
    const user = userEvent.setup()
    const { onSubmitted } = setup()
    createMock.mockResolvedValue({
      id: 'r1',
      restaurantId: 'rest-1',
      rating: 5,
      review: 'This is a genuinely long and useful review about the dinner.',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    })

    await user.click(screen.getByRole('radio', { name: 'Rate 5 stars' }))
    await user.type(
      screen.getByLabelText(/Tell us about your experience/),
      'This is a genuinely long and useful review about the dinner.',
    )
    await user.click(screen.getByRole('button', { name: /Submit Review/i }))

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1))
    expect(createMock).toHaveBeenCalledWith('rest-1', {
      rating: 5,
      review: 'This is a genuinely long and useful review about the dinner.',
    })
  })

  it('shows an error state when the API fails', async () => {
    const user = userEvent.setup()
    setup()
    createMock.mockRejectedValue(new Error('boom'))

    await user.click(screen.getByRole('radio', { name: 'Rate 4 stars' }))
    await user.type(
      screen.getByLabelText(/Tell us about your experience/),
      'A decent meal but the service was noticeably slow that evening.',
    )
    await user.click(screen.getByRole('button', { name: /Submit Review/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong while submitting your review',
    )
  })
})