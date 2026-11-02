import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import AdBanner from '@/components/AdBanner'

test('placeholder when no ad', () => {
  render(<AdBanner ad={null} slot="sidebar" />)
  expect(screen.getByRole('link', { name: /advertise here/i })).toHaveAttribute('href', '/advertise')
})

test('ad goes through /go and is labelled', () => {
  render(<AdBanner slot="home_banner" ad={{ id: 'ad1', imageUrl: 'https://x/y.png', linkUrl: 'https://adv.com', advertiserName: 'Adv' }} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/go/ad1')
  expect(screen.getByText('Ad')).toBeInTheDocument()
  expect(screen.getByRole('img')).toHaveAttribute('alt', 'Adv')
})
