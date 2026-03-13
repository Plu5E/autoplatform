import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const garageEmail = () => process.env.GARAGE_EMAIL || 'info@2maal2.be'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('garages')
    .select('naam, email, telefoon, website, logo_url, kleur, plan, adres, notificatie_email, notificatie_sms, auto_bod')
    .eq('email', garageEmail())
    .single()
  if (error) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { naam, telefoon, website, logo_url, kleur, adres, notificatie_email, notificatie_sms, auto_bod } = body
  const { data, error } = await supabaseAdmin
    .from('garages')
    .update({ naam, telefoon, website, logo_url, kleur, adres, notificatie_email, notificatie_sms, auto_bod })
    .eq('email', garageEmail())
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
