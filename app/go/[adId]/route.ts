import { NextResponse } from 'next/server'
import { getLiveAdById, recordAdClick } from '@/lib/data/ads'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, ctx: RouteContext<'/go/[adId]'>) {
  const { adId } = await ctx.params
  if (!/^[0-9a-f-]{36}$/i.test(adId)) return new NextResponse('Not found', { status: 404 })
  const sb = await createClient()
  const ad = await getLiveAdById(sb, adId)
  if (!ad || !/^https?:\/\//i.test(ad.link_url)) return new NextResponse('Not found', { status: 404 })
  await recordAdClick(sb, ad.id)
  return NextResponse.redirect(ad.link_url, { status: 302 })
}
