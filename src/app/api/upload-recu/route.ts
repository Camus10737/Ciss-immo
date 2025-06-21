import { NextRequest, NextResponse } from "next/server";
import { cloudinaryService } from "@/app/services/cloudinaryService";

export async function POST(req: NextRequest) {
  try {
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    // Lire le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Buffer length:", buffer.length, "Nom du fichier:", file.name);

    // Upload sur Cloudinary
    const result = await cloudinaryService.uploadRecu(buffer, file.name);

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}