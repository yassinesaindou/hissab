import { getDashboardData } from '@/app/actions';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await getDashboardData();
  return NextResponse.json(result);
}