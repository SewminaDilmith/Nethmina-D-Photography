import { defaultContent } from "./demo";
import { publicContent } from "./content-policy";
import type { SiteContent, Inquiry } from "./types";
const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};
export const isLive = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);
export const demoAllowed =
  !isLive && import.meta.env.PUBLIC_DEMO_MODE !== "false";
let services: Promise<any> | undefined;
export function firebase() {
  if (!isLive) throw new Error("Firebase is not configured.");
  return (services ??= Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]).then(async ([app, auth, db]) => {
    const instance = app.getApps()[0] || app.initializeApp(config);
    if (import.meta.env.PUBLIC_FIREBASE_APPCHECK_SITE_KEY) {
      const { initializeAppCheck, ReCaptchaEnterpriseProvider } =
        await import("firebase/app-check");
      initializeAppCheck(instance, {
        provider: new ReCaptchaEnterpriseProvider(
          import.meta.env.PUBLIC_FIREBASE_APPCHECK_SITE_KEY,
        ),
        isTokenAutoRefreshEnabled: true,
      });
    }
    return {
      auth: auth.getAuth(instance),
      db: db.getFirestore(instance),
      authApi: auth,
      dbApi: db,
    };
  }));
}
export function demoContent(): SiteContent {
  try {
    const saved = JSON.parse(
      localStorage.getItem("still-story-content") || "null",
    );
    return saved
      ? { ...structuredClone(defaultContent), ...saved }
      : structuredClone(defaultContent);
  } catch {
    return structuredClone(defaultContent);
  }
}
export async function loadContent(): Promise<SiteContent> {
  if (!isLive)
    return demoAllowed ? demoContent() : structuredClone(defaultContent);
  const { db, dbApi } = await firebase();
  const snap = await dbApi.getDoc(dbApi.doc(db, "site", "content"));
  return snap.exists()
    ? (snap.data() as SiteContent)
    : { ...structuredClone(defaultContent), albums: [] };
}
export async function saveContent(data: SiteContent) {
  // Strip unpublished work from the public document. Full editing data is admin-only.
  if (isLive) {
    const { db, dbApi } = await firebase();
    const batch = dbApi.writeBatch(db);
    batch.set(dbApi.doc(db, "private", "content"), data);
    batch.set(dbApi.doc(db, "site", "content"), publicContent(data));
    await batch.commit();
  } else if (demoAllowed) {
    try {
      localStorage.setItem("still-story-content", JSON.stringify(data));
    } catch {
      throw new Error(
        "Browser storage is full. Remove large demo photos or connect Cloudinary.",
      );
    }
  } else throw new Error("Connect Firebase before editing content.");
  window.dispatchEvent(new Event("content-updated"));
}
export async function loadAdminContent(): Promise<SiteContent> {
  if (!isLive) return demoContent();
  const { db, dbApi } = await firebase();
  const snap = await dbApi.getDoc(dbApi.doc(db, "private", "content"));
  return snap.exists() ? (snap.data() as SiteContent) : loadContent();
}
export async function submitInquiry(
  data: Omit<Inquiry, "id" | "createdAt" | "read">,
) {
  if (isLive) {
    const { db, dbApi } = await firebase();
    await dbApi.addDoc(dbApi.collection(db, "inquiries"), {
      ...data,
      createdAt: dbApi.serverTimestamp(),
      read: false,
    });
  } else if (demoAllowed) {
    const items = JSON.parse(
      localStorage.getItem("still-story-inquiries") || "[]",
    );
    items.unshift({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
    });
    localStorage.setItem("still-story-inquiries", JSON.stringify(items));
  } else
    throw new Error(
      "Enquiries are not configured yet. Please use the listed contact details.",
    );
}
export async function loadInquiries(): Promise<Inquiry[]> {
  if (!isLive)
    return JSON.parse(localStorage.getItem("still-story-inquiries") || "[]");
  const { db, dbApi } = await firebase();
  const snap = await dbApi.getDocs(
    dbApi.query(
      dbApi.collection(db, "inquiries"),
      dbApi.orderBy("createdAt", "desc"),
      dbApi.limit(100),
    ),
  );
  return snap.docs.map((d: any) => ({
    ...d.data(),
    id: d.id,
    createdAt:
      d.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
  }));
}
export async function setInquiryRead(item: Inquiry) {
  if (isLive) {
    const { db, dbApi } = await firebase();
    await dbApi.updateDoc(dbApi.doc(db, "inquiries", item.id), { read: true });
  } else {
    const items = await loadInquiries();
    localStorage.setItem(
      "still-story-inquiries",
      JSON.stringify(
        items.map((i) => (i.id === item.id ? { ...i, read: true } : i)),
      ),
    );
  }
}
export async function prepareImage(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Please choose a JPG, PNG, or WebP image.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose an image smaller than 20 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process image."))),
      "image/webp",
      0.85,
    ),
  );
}
export async function uploadPhoto(file: File): Promise<string> {
  const image = await prepareImage(file);
  if (!isLive) {
    if (!demoAllowed)
      throw new Error("Configure Firebase and Cloudinary first.");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(image);
    });
  }
  const { auth } = await firebase();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Please sign in again.");
  const sign = await fetch("/api/cloudinary-sign", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!sign.ok)
    throw new Error(
      "Upload is unavailable. Check your Cloudinary server configuration and admin access.",
    );
  const signed = await sign.json();
  const form = new FormData();
  form.set("file", image);
  for (const [key, value] of Object.entries(signed.params))
    form.set(key, String(value));
  form.set("api_key", signed.apiKey);
  form.set("signature", signed.signature);
  const result = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const body = await result.json();
  if (!result.ok) throw new Error(body.error?.message || "Upload failed.");
  return body.secure_url;
}
