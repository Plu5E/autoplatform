import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const garage_email = searchParams.get('garage') || process.env.GARAGE_EMAIL || 'info@2maal2.be'

  const { data: garage } = await supabaseAdmin
    .from('garages').select('id').eq('email', garage_email).single()

  if (!garage) return NextResponse.json(null, { status: 404 })

  const { data } = await supabaseAdmin
    .from('marges').select('*').eq('garage_id', garage.id).single()

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const garage_email = process.env.GARAGE_EMAIL || 'info@2maal2.be'

  const { data: garage } = await supabaseAdmin
    .from('garages').select('id').eq('email', garage_email).single()

  if (!garage) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('marges')
    .upsert({ garage_id: garage.id, ...body, bijgewerkt_op: new Date().toISOString() })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
