import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Pagination from '@/components/Pagination'

test('hides when one page, shows prev/next otherwise', () => {
  const { rerender } = render(<Pagination page={1} totalPages={1} makeHref={(p) => `/search?page=${p}`} />)
  expect(screen.queryByRole('navigation')).toBeNull()
  rerender(<Pagination page={2} totalPages={3} makeHref={(p) => `/search?page=${p}`} />)
  expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute('href', '/search?page=3')
  expect(screen.getByRole('link', { name: /previous/i })).toHaveAttribute('href', '/search?page=1')
  expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
})

test('no previous on first page, no next on last', () => {
  render(<Pagination page={3} totalPages={3} makeHref={(p) => `/s?page=${p}`} />)
  expect(screen.queryByRole('link', { name: /next/i })).toBeNull()
  expect(screen.getByRole('link', { name: /previous/i })).toBeInTheDocument()
})

test('out-of-range page is clamped to the last page', () => {
  render(<Pagination page={5} totalPages={2} makeHref={(p) => `/s?page=${p}`} />)
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /previous/i })).toHaveAttribute('href', '/s?page=1')
  expect(screen.queryByRole('link', { name: /next/i })).toBeNull()
})
