import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/cloudinary-sign.ts";
import { publicContent } from "../src/lib/content-policy.ts";

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
test("upload endpoint refuses unsupported methods and does not return a signature", async () => {
  const res = response();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "POST");
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.equal(res.body.signature, undefined);
});
test("anonymous visitors cannot obtain Cloudinary upload credentials", async () => {
  const res = response();
  await handler({ method: "POST", headers: {} }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.signature, undefined);
  assert.equal(res.body.apiKey, undefined);
});
test("missing server configuration fails closed without exposing secrets", async () => {
  const original = process.env.CLOUDINARY_API_SECRET;
  delete process.env.CLOUDINARY_API_SECRET;
  try {
    const res = response();
    await handler(
      { method: "POST", headers: { authorization: "Bearer invalid-token" } },
      res,
    );
    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, { error: "Photo uploads are not configured." });
  } finally {
    if (original !== undefined) process.env.CLOUDINARY_API_SECRET = original;
  }
});
test("public content excludes draft photos and does not mutate editing data", () => {
  const data = {
    name: "Studio",
    albums: [
      { id: "published", published: true, photos: [{ url: "public.jpg" }] },
      { id: "draft", published: false, photos: [{ url: "private-draft.jpg" }] },
    ],
  };
  const output = publicContent(data);
  assert.equal(output.albums.length, 1);
  assert.equal(output.albums[0].id, "published");
  assert.equal(data.albums.length, 2);
  assert.ok(!JSON.stringify(output).includes("private-draft.jpg"));
  assert.equal(output.name, "Studio");
});
test("an entirely draft collection publishes an empty album list", () => {
  assert.deepEqual(
    publicContent({ albums: [{ published: false }] }).albums,
    [],
  );
});
