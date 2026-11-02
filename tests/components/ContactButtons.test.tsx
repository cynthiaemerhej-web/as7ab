import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import ContactButtons from '@/components/ContactButtons'

test('renders only provided contacts', () => {
  render(<ContactButtons phone="+9613123456" whatsapp="+9613123456" instagram="mia.party" />)
  expect(screen.getByRole('link', { name: /call/i })).toHaveAttribute('href', 'tel:+9613123456')
  expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', 'https://wa.me/9613123456')
  expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute('href', 'https://instagram.com/mia.party')
  expect(screen.queryByRole('link', { name: /email/i })).toBeNull()
  expect(screen.queryByRole('link', { name: /website/i })).toBeNull()
})

test('external links open safely in a new tab', () => {
  render(<ContactButtons email="a@b.com" website="https://x.com" />)
  expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute('href', 'mailto:a@b.com')
  const site = screen.getByRole('link', { name: /website/i })
  expect(site).toHaveAttribute('target', '_blank')
  expect(site).toHaveAttribute('rel', 'noopener noreferrer')
})

test('nothing provided shows a hint', () => {
  render(<ContactButtons />)
  expect(screen.getByText(/no contact details/i)).toBeInTheDocument()
})
