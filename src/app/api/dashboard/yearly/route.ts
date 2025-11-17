import { getYearlyOverview } from '@/app/actions';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await getYearlyOverview();
  return NextResponse.json(result);
}