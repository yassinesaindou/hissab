 
import { loginAction } from '@/app/actions';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await loginAction(body);
  return Response.json(result);
}

