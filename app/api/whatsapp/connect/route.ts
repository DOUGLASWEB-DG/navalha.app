import { NextResponse } from 'next/server';
import { connectInstance } from '@/lib/whatsapp';

export async function GET() {
  const result = await connectInstance();
  return NextResponse.json(result);
}
