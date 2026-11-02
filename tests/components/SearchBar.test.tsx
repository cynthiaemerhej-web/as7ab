import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import SearchBar from '@/components/SearchBar'

test('two search bars on one page get distinct ids', () => {
  render(
    <>
      <SearchBar id="q-top" />
      <SearchBar id="q-mobile" defaultValue="cake" />
    </>,
  )
  const boxes = screen.getAllByRole('searchbox')
  expect(boxes.map((b) => b.id)).toEqual(['q-top', 'q-mobile'])
  expect(boxes[1]).toHaveValue('cake')
})
