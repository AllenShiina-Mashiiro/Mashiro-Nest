import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null | undefined;

export function isS3Configured() {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  );
}

export function getS3(): S3Client | null {
  if (client !== undefined) return client;
  if (!isS3Configured()) {
    client = null;
    return client;
  }

  client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
  });
  return client;
}

function publicBase() {
  const explicit = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "");
  if (endpoint) return `${endpoint}/${process.env.S3_BUCKET}`;
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION ?? "us-east-1"}.amazonaws.com`;
}

export function objectPublicUrl(key: string) {
  return `${publicBase()}/${key.replace(/^\//, "")}`;
}

/** `uploads/2025/<uuid>.png` — never trust a user supplied filename. */
export function buildObjectKey(filename: string) {
  const ext = (filename.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const year = new Date().getFullYear();
  return `uploads/${year}/${crypto.randomUUID()}.${ext || "bin"}`;
}

export async function createPresignedUpload(input: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  const s3 = getS3();
  if (!s3) throw new Error("S3_NOT_CONFIGURED");

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  return getSignedUrl(s3, command, { expiresIn: input.expiresIn ?? 600 });
}

export type MediaObject = {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
};

export async function listMedia(prefix = "uploads/", maxKeys = 60): Promise<MediaObject[]> {
  const s3 = getS3();
  if (!s3) return [];

  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    }),
  );

  return (result.Contents ?? [])
    .filter((item) => item.Key)
    .map((item) => ({
      key: item.Key as string,
      url: objectPublicUrl(item.Key as string),
      size: item.Size ?? 0,
      lastModified: item.LastModified?.toISOString() ?? null,
    }))
    .sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));
}

export async function deleteMedia(key: string) {
  const s3 = getS3();
  if (!s3) throw new Error("S3_NOT_CONFIGURED");
  await s3.send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
  );
}
