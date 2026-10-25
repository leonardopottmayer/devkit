import axios from 'axios'
import i18n from '@/i18n'

/** The one HTTP client of the app. An empty base URL means same origin (the dev server proxies /api). */
export const apiClient = axios.create({
  // fetch instead of XMLHttpRequest: same behavior in the browser, and MSW intercepts it in tests
  // (with MSW 3 and jsdom 30, XMLHttpRequest calls escape the mock server).
  adapter: 'fetch',
  baseURL: import.meta.env.VITE_API_URL?.trim() ?? '',
  headers: { 'Content-Type': 'application/json' },
})

// Every request carries the current language, so the API can localize its messages.
// The Authorization header and the 401 handling go here too, once the app has a login.
apiClient.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language
  return config
})
