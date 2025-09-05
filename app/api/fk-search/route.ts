import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const term = (searchParams.get('term') || '').trim()
  const maxRows = searchParams.get('maxRows') || '0'

  if (!term) {
    return NextResponse.json({ elements: [], fullList: false }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const upstream = `https://www.felleskatalogen.no/medisin/rest/internsok?maxRows=${encodeURIComponent(
    maxRows,
  )}&term=${encodeURIComponent(term)}`

  try {
    const res = await fetch(upstream, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ elements: [], error: 'Upstream error' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ elements: [], error: 'Network error' }, { status: 502 })
  }
}
