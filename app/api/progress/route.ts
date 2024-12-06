import { NextResponse } from 'next/server'
import { conversionProgress } from '@/app/lib/progress'

export async function GET() {
  return NextResponse.json(conversionProgress)
} 