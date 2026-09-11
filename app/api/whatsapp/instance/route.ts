import { NextResponse } from 'next/server';
import { createInstance, fetchConnectionStatus } from '@/lib/whatsapp';

export async function GET() {
  const status = await fetchConnectionStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const instance = await createInstance();
  return NextResponse.json(instance);
}
