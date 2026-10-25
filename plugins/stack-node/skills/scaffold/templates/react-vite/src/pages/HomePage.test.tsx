import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { HomePage } from './HomePage'

test('shows the title', () => {
  renderWithProviders(<HomePage />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome')
})
