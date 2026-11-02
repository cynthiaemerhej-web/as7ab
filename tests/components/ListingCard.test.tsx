import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import ListingCard from '@/components/ListingCard'

test('links to listing and shows badge, area and placeholder', () => {
  render(<ListingCard slug="cake-lady-3f2a9c" title="Cake Lady" categoryName="Food & Catering" area="Beirut" type="goods" photoUrl={null} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/l/cake-lady-3f2a9c')
  expect(screen.getByText('Goods')).toBeInTheDocument()
  expect(screen.getByText('Beirut')).toBeInTheDocument()
  expect(screen.getByText('Food & Catering')).toBeInTheDocument()
  expect(screen.queryByRole('img')).toBeNull()
})

test('renders the photo with the title as alt text', () => {
  render(<ListingCard slug="s" title="Cake Lady" categoryName="Food" area="Beirut" type="service" photoUrl="https://cdn/x.jpg" />)
  expect(screen.getByRole('img')).toHaveAttribute('alt', 'Cake Lady')
  expect(screen.getByText('Service')).toBeInTheDocument()
})
