import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, vi } from 'vitest'

afterEach(() => cleanup())

// next/image needs the Next runtime; under jsdom render a plain <img>.
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const rest = { ...props }
    delete rest.fill
    delete rest.priority
    delete rest.sizes
    return React.createElement('img', rest as React.ImgHTMLAttributes<HTMLImageElement>)
  },
}))
