import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('logo') as File
  if (!file) return NextResponse.json({ error: 'Geen bestand' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const bestandsnaam = `logos/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from('voertuig-fotos')
    .upload(bestandsnaam, buffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('voertuig-fotos').getPublicUrl(bestandsnaam)

  const garageEmail = process.env.GARAGE_EMAIL || 'info@2maal2.be'
  await supabaseAdmin.from('garages').update({ logo_url: publicUrl }).eq('email', garageEmail)

  return NextResponse.json({ url: publicUrl })
}
