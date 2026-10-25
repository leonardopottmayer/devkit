import { apiClient } from '@/lib/api/client'
import type { __Resource__Dto } from '../models'

const BASE = '/api/v1/__module__/__resources__'

export async function list__Resources__(): Promise<__Resource__Dto[]> {
  const { data } = await apiClient.get<__Resource__Dto[]>(BASE)
  return data
}
