import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { __Module__Page } from './__Module__Page'

test('lists the __resources__ once they load', async () => {
  server.use(
    http.get('http://localhost/api/v1/__module__/__resources__', () =>
      HttpResponse.json([{ id: '1', name: 'First' }]),
    ),
  )

  renderWithProviders(<__Module__Page />)

  expect(await screen.findByText('First')).toBeInTheDocument()
})
