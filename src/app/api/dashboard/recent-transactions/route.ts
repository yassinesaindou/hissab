import { getRecentTransactions } from '@/app/actions';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await getRecentTransactions();
  return NextResponse.json(result);
}