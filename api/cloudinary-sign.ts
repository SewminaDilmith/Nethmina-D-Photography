import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type VercelResponse = ServerResponse & {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
};
export default async function handler(
  req: IncomingMessage,
  res: VercelResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: "Sign in to upload." });
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_UPLOAD_PRESET,
  } = process.env;
  if (
    !FIREBASE_PROJECT_ID ||
    !FIREBASE_CLIENT_EMAIL ||
    !FIREBASE_PRIVATE_KEY ||
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET ||
    !CLOUDINARY_UPLOAD_PRESET
  )
    return res.status(503).json({ error: "Photo uploads are not configured." });
  try {
    const app =
      getApps()[0] ||
      initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    let uid: string;
    try {
      uid = (await getAuth(app).verifyIdToken(token, true)).uid;
    } catch {
      return res
        .status(401)
        .json({ error: "Your session has expired. Please sign in again." });
    }
    const admin = await getFirestore(app).doc(`admins/${uid}`).get();
    if (!admin.exists || admin.data()?.enabled !== true)
      return res.status(403).json({ error: "Studio access required." });
    const params = {
      folder: "still-and-story",
      timestamp: Math.floor(Date.now() / 1000),
      upload_preset: CLOUDINARY_UPLOAD_PRESET,
    };
    const payload = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const signature = createHash("sha1")
      .update(payload + CLOUDINARY_API_SECRET)
      .digest("hex");
    return res.status(200).json({
      params,
      signature,
      apiKey: CLOUDINARY_API_KEY,
      cloudName: CLOUDINARY_CLOUD_NAME,
    });
  } catch {
    return res.status(500).json({
      error: "Could not authorise the upload. Check the server configuration.",
    });
  }
}
