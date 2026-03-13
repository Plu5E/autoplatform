import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { status, bod } = body

  const updates: Record<string, unknown> = {}
  if (status) {
    updates.status = status
    if (status === 'bod_verstuurd') updates.bod_verstuurd_op = new Date().toISOString()
    if (status === 'geaccepteerd') updates.geaccepteerd_op = new Date().toISOString()
    if (status === 'afgerond') updates.afgerond_op = new Date().toISOString()
  }
  if (bod) updates.bod = bod

  const { data, error } = await supabaseAdmin
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
