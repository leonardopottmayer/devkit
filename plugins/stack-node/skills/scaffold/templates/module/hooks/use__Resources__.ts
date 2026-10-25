import { useQuery } from '@tanstack/react-query'
import { __module__Keys } from './queryKeys'
import * as __resources__Service from '../services/__resources__.service'

export function use__Resources__() {
  return useQuery({
    queryKey: __module__Keys.__resources__(),
    queryFn: () => __resources__Service.list__Resources__(),
  })
}
