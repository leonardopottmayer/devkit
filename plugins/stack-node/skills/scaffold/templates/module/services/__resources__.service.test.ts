import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { list__Resources__ } from './__resources__.service'

test('lists the __resources__ the API returns', async () => {
  server.use(
    http.get('http://localhost/api/v1/__module__/__resources__', () =>
      HttpResponse.json([{ id: '1', name: 'First' }]),
    ),
  )

  await expect(list__Resources__()).resolves.toEqual([{ id: '1', name: 'First' }])
})
