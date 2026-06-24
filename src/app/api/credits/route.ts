// app/api/credits/route.ts
import { deleteCreditAction } from "@/app/(main)/(features)/credits/actions/action";
import { NextRequest, NextResponse } from "next/server";
 

export async function DELETE(req: NextRequest) {
  try {
    const { creditId } = await req.json();
    if (!creditId) {
      return NextResponse.json({ success: false, message: "creditId manquant" }, { status: 400 });
    }

    const result = await deleteCreditAction(creditId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in DELETE /api/credits:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}