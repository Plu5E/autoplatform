import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { STANDAARD_FOTOS_CONFIG } from '@/lib/fotos'

const garageEmail = () => process.env.GARAGE_EMAIL || 'info@2maal2.be'

export async function GET() {
  const { data: garage } = await supabaseAdmin
    .from('garages').select('id').eq('email', garageEmail()).single()
  if (!garage) return NextResponse.json(STANDAARD_FOTOS_CONFIG)

  const { data } = await supabaseAdmin
    .from('marges').select('fotos_config').eq('garage_id', garage.id).single()

  return NextResponse.json(data?.fotos_config || STANDAARD_FOTOS_CONFIG)
}

export async function PUT(req: NextRequest) {
  const config = await req.json()
  const { data: garage } = await supabaseAdmin
    .from('garages').select('id').eq('email', garageEmail()).single()
  if (!garage) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('marges').update({ fotos_config: config }).eq('garage_id', garage.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
