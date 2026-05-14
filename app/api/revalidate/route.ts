import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyCronAuth } from '@/lib/utils/cronAuth'

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { path } = await request.json()
    if (path) {
      revalidatePath(path)
      return NextResponse.json({ success: true, revalidated: path })
    }
    // Revalidate all listing pages
    revalidatePath('/')
    revalidatePath('/stocks')
    revalidatePath('/indices')
    revalidatePath('/gold')
    revalidatePath('/commodities')
    return NextResponse.json({ success: true, revalidated: 'all' })
  } catch (error) {
    console.error('[revalidate] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
