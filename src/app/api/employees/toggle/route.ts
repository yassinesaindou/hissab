// app/api/employees/toggle/route.ts
import { toggleEmployeeStatus } from '@/app/actions';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const formData = await req.formData();
  const result = await toggleEmployeeStatus(formData);
  return NextResponse.json(result);
}