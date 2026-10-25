import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "File name missing" });
    }

    const key = `${folder || "pod"}/${fileName}`;

    // Ek temporary URL (15 minute ke liye valid) generate karo
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType || "image/jpeg",
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return res.status(200).json({ success: true, uploadUrl, publicUrl });
  } catch (error) {
    console.error("Presign error:", error);
    return res.status(500).json({ error: error.message });
  }
}