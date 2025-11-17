import { getRecentCredits } from '@/app/actions';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await getRecentCredits();
  return NextResponse.json(result);
}