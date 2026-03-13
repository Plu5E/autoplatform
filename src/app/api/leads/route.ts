import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const garage_email = process.env.GARAGE_EMAIL || 'info@2maal2.be'

  const { data: garage } = await supabaseAdmin
    .from('garages').select('id').eq('email', garage_email).single()

  if (!garage) return NextResponse.json([], { status: 200 })

  let query = supabaseAdmin
    .from('leads')
    .select('*')
    .eq('garage_id', garage.id)
    .order('aangemaakt_op', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const garage_email = process.env.GARAGE_EMAIL || 'info@2maal2.be'

  const { data: garage } = await supabaseAdmin
    .from('garages').select('id').eq('email', garage_email).single()

  if (!garage) return NextResponse.json({ error: 'Garage niet gevonden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({ ...body, garage_id: garage.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
