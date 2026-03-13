import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('fotos') as File[]
  if (!files.length) return NextResponse.json({ error: 'Geen bestanden' }, { status: 400 })

  const urls: string[] = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const naam = `voertuigen/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await supabaseAdmin.storage
      .from('voertuig-fotos')
      .upload(naam, buffer, { contentType: file.type, upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabaseAdmin.storage.from('voertuig-fotos').getPublicUrl(naam)
      urls.push(publicUrl)
    }
  }
  return NextResponse.json({ urls })
}
