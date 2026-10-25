import { setupServer } from 'msw/node'

// Empty on purpose: each test declares the responses it needs with `server.use(...)`.
export const server = setupServer()
