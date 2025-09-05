import { FkItem, FkResponse } from '@/components/sections/hero'
import { useEffect, useRef, useState } from 'react'

type Options = { maxRows?: number }

export function useFkSearch(term: string, { maxRows = 0 }: Options = {}) {
  const [results, setResults] = useState<FkItem[]>([])
  const [loading, setLoading] = useState(false)
  const cacheRef = useRef<Map<string, FkItem[]>>(new Map())

  useEffect(() => {
    const t = term.trim()
    if (!t) {
      setResults([])
      setLoading(false)
      return
    }

    const key = `${t}|${maxRows}`
    if (cacheRef.current.has(key)) {
      setResults(cacheRef.current.get(key)!)
      return
    }

    const ctrl = new AbortController()
    setLoading(true)
    fetch(`/api/fk-search?term=${encodeURIComponent(t)}&maxRows=${maxRows}`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: FkResponse) => {
        const list = data?.elements || []
        cacheRef.current.set(key, list)
        setResults(list)
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setResults([])
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })

    return () => ctrl.abort()
  }, [term, maxRows])

  return { results, loading }
}
