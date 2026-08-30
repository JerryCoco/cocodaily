import { requireStaff } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { cloudinary, UPLOAD_FOLDER } from "@/lib/cloudinary";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const OK_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function POST(req: Request) {
  await requireStaff();

  const form = await req.formData();
  const file = form.get("file");
  const alt = (form.get("alt") as string | null)?.trim() ?? "";

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  if (!OK_TYPES.has(file.type)) {
    return Response.json({ error: "Use JPEG, PNG, WebP, AVIF, or GIF." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 8 MB or smaller." }, { status: 413 });
  }
  if (!alt) {
    // Alt text is required — accessibility, and it's cheap to enforce here.
    return Response.json({ error: "Describe the image (alt text) before uploading." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const uploaded = await new Promise<{
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: UPLOAD_FOLDER, resource_type: "image", overwrite: false },
        (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res)),
      )
      .end(bytes);
  }).catch((err) => {
    console.error("[media/upload] cloudinary", err);
    return null;
  });

  if (!uploaded) {
    return Response.json({ error: "Upload failed. Try again." }, { status: 502 });
  }

  const media = await prisma.media.create({
    data: {
      originalUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
      alt,
      width: uploaded.width,
      height: uploaded.height,
    },
  });

  return Response.json({
    id: media.id,
    url: media.originalUrl,
    publicId: media.publicId,
    alt: media.alt,
    width: media.width,
    height: media.height,
  });
}
