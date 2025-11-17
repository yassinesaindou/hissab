// app/api/auth/signup/route.ts

import { signupAction } from '@/app/actions';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await signupAction(body);
  return Response.json(result);
}