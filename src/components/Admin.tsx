import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  Images,
  SlidersHorizontal,
  Inbox,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Upload,
  Save,
  Check,
  X,
  Loader2,
  Eye,
  Download,
  ImagePlus,
  CircleHelp,
} from "lucide-react";
import { defaultContent } from "../lib/demo";
import {
  demoAllowed,
  isLive,
  firebase,
  loadAdminContent,
  saveContent,
  loadInquiries,
  setInquiryRead,
  uploadPhoto,
} from "../lib/backend";
import {
  categories,
  type Album,
  type SiteContent,
  type Inquiry,
} from "../lib/types";
type Tab = "Overview" | "Albums" | "Site details" | "Enquiries" | "Setup";
const tabs: { name: Tab; icon: typeof Images }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Albums", icon: Images },
  { name: "Site details", icon: SlidersHorizontal },
  { name: "Enquiries", icon: Inbox },
  { name: "Setup", icon: Settings },
];
export default function Admin() {
  const [user, setUser] = useState(false);
  const [authLoading, setAuthLoading] = useState(isLive);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("Overview");
  const [content, setContent] = useState<SiteContent>(
    structuredClone(defaultContent),
  );
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState("");
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (deleteId) deleteDialogRef.current?.showModal();
    else deleteDialogRef.current?.close();
  }, [deleteId]);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const flash = (message: string) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 5000);
  };
  async function hydrate() {
    setBusy(true);
    try {
      const [data, items] = await Promise.all([
        loadAdminContent(),
        loadInquiries(),
      ]);
      setContent(data);
      setInquiries(items);
      setSelected(data.albums[0]?.id || "");
      setUser(true);
      setDirty(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load your dashboard.",
      );
    } finally {
      setBusy(false);
      setAuthLoading(false);
    }
  }
  useEffect(() => {
    if (!isLive) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    firebase()
      .then(({ auth, authApi, db, dbApi }) => {
        if (cancelled) return;
        unsubscribe = authApi.onAuthStateChanged(auth, async (current: any) => {
          if (current) {
            try {
              const access = await dbApi.getDoc(
                dbApi.doc(db, "admins", current.uid),
              );
              if (!access.exists() || access.data()?.enabled !== true) {
                await authApi.signOut(auth);
                setError(
                  "This account does not have studio access. Add its UID to the admins collection.",
                );
                setAuthLoading(false);
                return;
              }
              await hydrate();
            } catch {
              setError(
                "Could not verify admin access. Check your Firestore rules.",
              );
              setAuthLoading(false);
            }
          } else {
            setUser(false);
            setAuthLoading(false);
          }
        });
      })
      .catch(() => {
        setError("Firebase could not start. Check your configuration.");
        setAuthLoading(false);
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
      clearTimeout(noticeTimer.current);
    };
  }, []);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function login(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { auth, authApi } = await firebase();
      await authApi.signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch {
      setError("Sign-in failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (dirty && !window.confirm("Leave without saving your changes?")) return;
    if (isLive) {
      const { auth, authApi } = await firebase();
      await authApi.signOut(auth);
    }
    setUser(false);
    setDirty(false);
    setLoginPassword("");
  }
  const edit = (patch: Partial<SiteContent>) => {
    setContent((current) => ({ ...current, ...patch }));
    setDirty(true);
  };
  const active = content.albums.find((a) => a.id === selected);
  const editAlbum = (patch: Partial<Album>) => {
    if (active)
      edit({
        albums: content.albums.map((a) =>
          a.id === active.id ? { ...a, ...patch } : a,
        ),
      });
  };
  async function save() {
    setBusy(true);
    setError("");
    try {
      if (content.albums.some((a) => !a.title.trim()))
        throw new Error("Every album needs a title.");
      if (content.albums.some((a) => a.published && !a.photos.length))
        throw new Error(
          "Add a photo before publishing an album, or save it as a draft.",
        );
      if (content.albums.some((a) => a.photos.some((p) => !p.alt.trim())))
        throw new Error("Add a description to each photo before saving.");
      if (!content.name.trim()) throw new Error("Your studio needs a name.");
      await saveContent(content);
      setDirty(false);
      flash(
        isLive
          ? "Changes published to your website."
          : "Changes saved in this browser.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes.");
    } finally {
      setBusy(false);
    }
  }
  function addAlbum() {
    const album: Album = {
      id: crypto.randomUUID(),
      title: "Untitled story",
      category: "Weddings",
      location: "",
      description: "",
      published: false,
      photos: [],
    };
    edit({ albums: [album, ...content.albums] });
    setSelected(album.id);
    setTab("Albums");
  }
  async function upload(files: FileList | null) {
    if (!files || !active) return;
    setUploading(true);
    setError("");
    try {
      const photos = [];
      for (const file of Array.from(files)) {
        const url = await uploadPhoto(file);
        photos.push({
          id: crypto.randomUUID(),
          url,
          alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        });
      }
      editAlbum({ photos: [...active.photos, ...photos] });
      flash(
        `${photos.length} photo${photos.length === 1 ? "" : "s"} added. Save to publish.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  function reorder(index: number, direction: number) {
    if (!active) return;
    const photos = [...active.photos];
    [photos[index], photos[index + direction]] = [
      photos[index + direction],
      photos[index],
    ];
    editAlbum({ photos });
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ content, inquiries }, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "still-and-story-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  if (authLoading)
    return (
      <main id="main" className="admin-loading">
        <Loader2 className="spin" /> Opening your studio…
      </main>
    );
  if (!user)
    return (
      <main id="main" className="login-page">
        <div className="login-theme"><ThemeToggle /></div>
        <a className="login-back text-link" href="/">
          <ArrowLeft size={16} />
          Back to the website
        </a>
        <div className="login-photo">
          <img src="/images/wedding.jpg" alt="A wedding story" />
          <div>
            <span className="eyebrow">YOUR STORIES, ALL IN ONE PLACE</span>
            <h1>
              A little space
              <br />
              <em>for your studio.</em>
            </h1>
          </div>
        </div>
        <div className="login-panel">
          <a href="/" className="wordmark">
            {content.name}
            <span>STUDIO DASHBOARD</span>
          </a>
          <h2>Welcome back.</h2>
          <p>Make room for your next story.</p>
          {isLive ? (
            <form onSubmit={login}>
              <label>
                Email address
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </label>
              <button className="button full-width" disabled={busy}>
                {busy ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <>
                    Open my studio <ArrowUpRight size={18} />
                  </>
                )}
              </button>
              <button
                type="button"
                className="text-link forgot-password"
                onClick={async () => {
                  if (!loginEmail) {
                    setError("Enter your email address first.");
                    return;
                  }
                  try {
                    const { auth, authApi } = await firebase();
                    await authApi.sendPasswordResetEmail(auth, loginEmail);
                    flash(
                      "If this account exists, a password reset email is on its way.",
                    );
                  } catch {
                    setError(
                      "Could not request a password reset. Please try again.",
                    );
                  }
                }}
              >
                Forgot your password?
              </button>
            </form>
          ) : (
            <div className="demo-login">
              <div className="demo-label">
                {demoAllowed ? "DEMO STUDIO" : "SETUP REQUIRED"}
              </div>
              <p>
                {demoAllowed
                  ? "Explore the dashboard, edit albums, and try the upload flow. Demo changes are saved only in this browser."
                  : "Firebase is not configured. Connect the environment variables to enable secure admin login."}
              </p>
              {demoAllowed && (
                <button
                  className="button full-width"
                  onClick={hydrate}
                  disabled={busy}
                >
                  Explore the demo dashboard{" "}
                  {busy ? (
                    <Loader2 className="spin" size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </button>
              )}
              <p className="small-note">
                Live admin access uses Firebase Authentication and restricted
                Firestore permissions.
              </p>
            </div>
          )}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
        </div>
      </main>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="wordmark" href="/">
          {content.name}
          <span>STUDIO DASHBOARD</span>
        </a>
        <div className="studio-tag">
          <span className={`status-dot ${isLive ? "live" : ""}`} />
          {isLive ? "CONNECTED STUDIO" : "BROWSER DEMO"}
        </div>
        <nav aria-label="Studio navigation">
          {tabs.map(({ name, icon: Icon }) => (
            <button
              className={tab === name ? "admin-nav active" : "admin-nav"}
              key={name}
              onClick={() => {
                setTab(name);
                setError("");
              }}
            >
              <Icon size={18} />
              {name}
              {name === "Enquiries" && inquiries.some((i) => !i.read) && (
                <span className="unread-count">
                  {inquiries.filter((i) => !i.read).length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            <Eye size={17} />
            View website <ArrowUpRight size={14} />
          </a>
          <button onClick={logout}>
            <LogOut size={17} />
            Leave studio
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">YOUR CREATIVE SPACE</span>
            <h1>{tab === "Overview" ? "The studio" : tab}</h1>
          </div>
          <div className="admin-top-actions">
            <ThemeToggle />
            <button
              className="icon-button"
              aria-label="Leave studio"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
            <span className="save-status">
              {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <button
              className="button"
              onClick={save}
              disabled={busy || uploading || !dirty}
            >
              {busy ? (
                <Loader2 className="spin" size={17} />
              ) : (
                <Save size={17} />
              )}{" "}
              Save changes
            </button>
          </div>
        </header>
        <main id="main" className="admin-content">
          {!isLive && (
            <div className="demo-banner">
              <CircleHelp size={17} />
              <span>
                Demo mode. Changes and enquiries stay in this browser. Connect
                Firebase and Cloudinary to go live.
              </span>
              <button onClick={() => setTab("Setup")}>
                View setup <ArrowRight size={14} />
              </button>
            </div>
          )}
          {error && (
            <div className="error-message" role="alert">
              {error}
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {tab === "Overview" && (
            <>
              <section className="admin-welcome">
                <div>
                  <span className="eyebrow">A FRESH PAGE, A NEW STORY</span>
                  <h2>
                    Good things
                    <br />
                    <em>are worth keeping.</em>
                  </h2>
                  <p>
                    Your work, your words, your little corner of the internet.
                  </p>
                  <button className="button" onClick={addAlbum}>
                    Add a new story <Plus size={17} />
                  </button>
                </div>
                <img src="/images/couple.jpg" alt="A photographic story" />
              </section>
              <div className="stat-grid">
                <div>
                  <Images size={20} />
                  <span>{content.albums.length}</span>
                  <p>Total albums</p>
                </div>
                <div>
                  <Eye size={20} />
                  <span>
                    {content.albums.filter((a) => a.published).length}
                  </span>
                  <p>Published stories</p>
                </div>
                <div>
                  <ImagePlus size={20} />
                  <span>
                    {content.albums.reduce((n, a) => n + a.photos.length, 0)}
                  </span>
                  <p>Photographs</p>
                </div>
                <div>
                  <Inbox size={20} />
                  <span>{inquiries.filter((i) => !i.read).length}</span>
                  <p>Unread enquiries</p>
                </div>
              </div>
              <div className="admin-section-heading">
                <h3>Your latest stories</h3>
                <button className="text-link" onClick={() => setTab("Albums")}>
                  Manage all albums <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="admin-album-grid">
                {content.albums.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    className="admin-album-preview"
                    onClick={() => {
                      setSelected(a.id);
                      setTab("Albums");
                    }}
                  >
                    {a.photos[0] ? (
                      <img src={a.photos[0].url} alt={a.photos[0].alt} />
                    ) : (
                      <div className="image-placeholder">
                        <Images />
                      </div>
                    )}
                    <div>
                      <span className="eyebrow">{a.category}</span>
                      <h4>{a.title}</h4>
                      <p>
                        {a.photos.length} photos{" "}
                        <span className={a.published ? "published" : "draft"}>
                          {a.published ? "Published" : "Draft"}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          {tab === "Albums" && (
            <div className="album-workspace">
              <div className="album-list">
                <div className="admin-section-heading">
                  <h3>Your stories</h3>
                  <button
                    className="icon-button"
                    aria-label="Add album"
                    onClick={addAlbum}
                  >
                    <Plus size={19} />
                  </button>
                </div>
                {content.albums.map((a) => (
                  <button
                    className={`album-list-item ${selected === a.id ? "selected" : ""}`}
                    key={a.id}
                    onClick={() => setSelected(a.id)}
                  >
                    {a.photos[0] ? (
                      <img src={a.photos[0].url} alt="" />
                    ) : (
                      <span className="list-placeholder">
                        <Images size={20} />
                      </span>
                    )}
                    <span>
                      <strong>{a.title}</strong>
                      <small>
                        {a.category} · {a.photos.length} photos
                      </small>
                      <small>{a.published ? "Published" : "Draft"}</small>
                    </span>
                  </button>
                ))}
                <button className="add-album" onClick={addAlbum}>
                  <Plus size={17} />
                  Create album
                </button>
              </div>
              {active ? (
                <section className="album-editor">
                  <div className="admin-section-heading">
                    <h3>Edit story</h3>
                    <button
                      className="danger-link"
                      onClick={() => setDeleteId(active.id)}
                    >
                      <Trash2 size={15} />
                      Delete album
                    </button>
                  </div>
                  <div className="form-grid">
                    <label>
                      Album title
                      <input
                        value={active.title}
                        maxLength={120}
                        onChange={(e) => editAlbum({ title: e.target.value })}
                      />
                    </label>
                    <label>
                      Category
                      <select
                        value={active.category}
                        onChange={(e) =>
                          editAlbum({
                            category: e.target.value as Album["category"],
                          })
                        }
                      >
                        {categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Location or subtitle
                    <input
                      value={active.location}
                      maxLength={200}
                      onChange={(e) => editAlbum({ location: e.target.value })}
                    />
                  </label>
                  <label>
                    The story
                    <textarea
                      value={active.description}
                      maxLength={2000}
                      rows={3}
                      onChange={(e) =>
                        editAlbum({ description: e.target.value })
                      }
                    />
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={active.published}
                      onChange={(e) =>
                        editAlbum({ published: e.target.checked })
                      }
                    />
                    <span>
                      Publish this album on the website
                      <small>Uncheck to keep this story as a draft.</small>
                    </span>
                  </label>
                  <div className="admin-section-heading photo-heading">
                    <div>
                      <h3>
                        Photographs{" "}
                        <span className="muted">({active.photos.length})</span>
                      </h3>
                      <p>
                        The first photo is your album cover. Use arrows to
                        reorder.
                      </p>
                    </div>
                    <button
                      className="button button-small"
                      disabled={uploading}
                      onClick={() => inputRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <Upload size={16} />
                      )}{" "}
                      Upload photos
                    </button>
                    <input
                      ref={inputRef}
                      hidden
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => upload(e.target.files)}
                    />
                  </div>
                  <div className="editor-photos">
                    {active.photos.map((p, index) => (
                      <div className="editor-photo" key={p.id}>
                        <div className="editor-photo-image">
                          <img src={p.url} alt={p.alt} />
                          {index === 0 && (
                            <span className="cover-badge">COVER</span>
                          )}
                          <button
                            className="remove-photo icon-button"
                            aria-label={`Remove photo ${index + 1}`}
                            onClick={() =>
                              editAlbum({
                                photos: active.photos.filter(
                                  (photo) => photo.id !== p.id,
                                ),
                              })
                            }
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <label>
                          Photo description
                          <input
                            value={p.alt}
                            maxLength={250}
                            onChange={(e) =>
                              editAlbum({
                                photos: active.photos.map((photo) =>
                                  photo.id === p.id
                                    ? { ...photo, alt: e.target.value }
                                    : photo,
                                ),
                              })
                            }
                          />
                        </label>
                        <div className="photo-order">
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <button
                            className="icon-button"
                            disabled={index === 0}
                            aria-label={`Move photo ${index + 1} earlier`}
                            onClick={() => reorder(index, -1)}
                          >
                            <ArrowLeft size={16} />
                          </button>
                          <button
                            className="icon-button"
                            disabled={index === active.photos.length - 1}
                            aria-label={`Move photo ${index + 1} later`}
                            onClick={() => reorder(index, 1)}
                          >
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!active.photos.length && (
                    <button
                      className="upload-drop"
                      disabled={uploading}
                      onClick={() => inputRef.current?.click()}
                    >
                      <Upload size={26} />
                      <strong>Give this story its first photograph</strong>
                      <span>
                        JPG, PNG, or WebP · Up to 20 MB · Resized before upload
                      </span>
                    </button>
                  )}
                </section>
              ) : (
                <div className="empty-state">
                  <Images size={30} />
                  <p>Your next story starts here.</p>
                  <button className="button" onClick={addAlbum}>
                    Create your first album <Plus size={17} />
                  </button>
                </div>
              )}
            </div>
          )}
          {tab === "Site details" && (
            <section className="details-editor">
              <div className="admin-section-heading">
                <div>
                  <h3>Make it yours</h3>
                  <p>Your words, your details, your first impression.</p>
                </div>
              </div>
              <div className="form-grid">
                {[
                  ["name", "Studio name"],
                  ["location", "Location / availability"],
                  ["email", "Contact email"],
                  ["phone", "Phone number"],
                  ["whatsapp", "WhatsApp number (with country code)"],
                  ["instagram", "Instagram username"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type={key === "email" ? "email" : "text"}
                      value={content[key as keyof SiteContent] as string}
                      maxLength={250}
                      onChange={(e) => edit({ [key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <label>
                Hero heading (one line per line)
                <textarea
                  rows={2}
                  value={content.tagline}
                  maxLength={180}
                  onChange={(e) => edit({ tagline: e.target.value })}
                />
              </label>
              <label>
                Short introduction
                <textarea
                  rows={3}
                  value={content.intro}
                  maxLength={500}
                  onChange={(e) => edit({ intro: e.target.value })}
                />
              </label>
              <label>
                About you
                <textarea
                  rows={7}
                  value={content.about}
                  maxLength={5000}
                  onChange={(e) => edit({ about: e.target.value })}
                />
              </label>
              <div className="admin-section-heading">
                <h3>Your services</h3>
              </div>
              {content.services.map((item, index) => (
                <div key={item.name}>
                  <label>
                    {item.name} subtitle
                    <input
                      value={item.line}
                      maxLength={180}
                      onChange={(e) =>
                        edit({
                          services: content.services.map((s, i) =>
                            i === index ? { ...s, line: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    {item.name} description
                    <textarea
                      rows={3}
                      value={item.detail}
                      maxLength={1500}
                      onChange={(e) =>
                        edit({
                          services: content.services.map((s, i) =>
                            i === index ? { ...s, detail: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </label>
                </div>
              ))}
              <div className="form-grid">
                {[
                  ["hero", "Hero photograph"],
                  ["aboutImage", "About photograph"],
                ].map(([key, label]) => (
                  <div className="site-image-field" key={key}>
                    <label>
                      {label}
                      <input
                        value={content[key as "hero" | "aboutImage"]}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            !value ||
                            value.startsWith("/") ||
                            value.startsWith("https://") ||
                            value.startsWith("data:image/")
                          )
                            edit({ [key]: value });
                        }}
                      />
                    </label>
                    <img
                      src={content[key as "hero" | "aboutImage"]}
                      alt={`${label} preview`}
                    />
                    <label className="button upload-label">
                      <Upload size={16} />
                      Replace photo
                      <input
                        type="file"
                        hidden
                        disabled={uploading}
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          try {
                            edit({ [key]: await uploadPhoto(file) });
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Upload failed.",
                            );
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}
          {tab === "Enquiries" && (
            <section className="inquiries">
              <div className="admin-section-heading">
                <div>
                  <h3>A new story starts with hello</h3>
                  <p>
                    {isLive
                      ? "The latest 100 enquiries, newest first."
                      : "Sample submissions from the demo contact form appear here."}
                  </p>
                </div>
                <button
                  className="text-link"
                  onClick={async () => {
                    try {
                      setInquiries(await loadInquiries());
                      flash("Enquiries refreshed.");
                    } catch {
                      setError("Could not refresh enquiries.");
                    }
                  }}
                >
                  Refresh <ArrowRight size={15} />
                </button>
              </div>
              {!inquiries.length ? (
                <div className="empty-state">
                  <Inbox size={32} />
                  <h3>A little quiet, for now.</h3>
                  <p>
                    New enquiries will appear here when someone gets in touch.
                  </p>
                  <a
                    className="text-link"
                    href="/#contact"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View contact form <ArrowUpRight size={16} />
                  </a>
                </div>
              ) : (
                inquiries.map((item) => (
                  <article
                    key={item.id}
                    className={`inquiry-card ${item.read ? "" : "unread"}`}
                  >
                    <div className="inquiry-header">
                      <div>
                        <span className="eyebrow">
                          {item.type} ·{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <h3>{item.name}</h3>
                        <a href={`mailto:${item.email}`}>{item.email}</a>
                      </div>
                      {!item.read && (
                        <button
                          className="text-link"
                          onClick={async () => {
                            try {
                              await setInquiryRead(item);
                              setInquiries((items) =>
                                items.map((i) =>
                                  i.id === item.id ? { ...i, read: true } : i,
                                ),
                              );
                            } catch {
                              setError("Could not mark enquiry as read.");
                            }
                          }}
                        >
                          <Check size={16} />
                          Mark as read
                        </button>
                      )}
                    </div>
                    <div className="inquiry-meta">
                      {item.date && <span>Preferred date: {item.date}</span>}
                      {item.location && <span>Location: {item.location}</span>}
                    </div>
                    <p className="inquiry-message">{item.message}</p>
                    <a
                      className="button button-small"
                      href={`mailto:${item.email}?subject=${encodeURIComponent(`Your ${item.type.toLowerCase()} photography enquiry`)}`}
                    >
                      Reply by email <ArrowUpRight size={16} />
                    </a>
                  </article>
                ))
              )}
            </section>
          )}
          {tab === "Setup" && (
            <section className="setup-panel">
              <div className="admin-section-heading">
                <div>
                  <h3>Ready when you are</h3>
                  <p>
                    The website works as a demo now. Connect your accounts for
                    shared, live content.
                  </p>
                </div>
              </div>
              <div className="setup-status">
                <div>
                  <span className={`status-dot ${isLive ? "live" : ""}`} />
                  <strong>Firebase Authentication & Firestore</strong>
                  <span>{isLive ? "Configured" : "Not connected"}</span>
                </div>
                <div>
                  <span className="status-dot" />
                  <strong>Cloudinary uploads</strong>
                  <span>Configured with server secrets in Vercel</span>
                </div>
              </div>
              <ol className="setup-steps">
                <li>
                  <h4>Connect Firebase</h4>
                  <p>
                    Create a web app, enable email/password authentication,
                    create Firestore in production mode, and add your public
                    Firebase values from .env.example to Vercel.
                  </p>
                </li>
                <li>
                  <h4>Give yourself studio access</h4>
                  <p>
                    Create your account in Firebase Authentication. In
                    Firestore, create an admins collection and a document whose
                    ID is your account UID. Add an enabled boolean set to true.
                    Deploy the included firestore.rules.
                  </p>
                </li>
                <li>
                  <h4>Connect Cloudinary</h4>
                  <p>
                    Add your Cloudinary cloud name, API key, API secret, and
                    signed upload preset to Vercel. Add Firebase Admin
                    service-account values so the upload endpoint can verify
                    your login.
                  </p>
                </li>
                <li>
                  <h4>Make the site yours</h4>
                  <p>
                    Replace the sample albums, studio copy, and images. Set
                    PUBLIC_DEMO_MODE=false, redeploy, then sign in and save your
                    content to publish it.
                  </p>
                </li>
              </ol>
              <div className="backup-panel">
                <div>
                  <h3>Keep a copy of your stories</h3>
                  <p>
                    Download the current content and enquiries as a JSON backup.
                    This download is not an automatic cloud backup.
                  </p>
                </div>
                <button className="button button-small" onClick={exportData}>
                  <Download size={16} />
                  Export backup
                </button>
              </div>
            </section>
          )}
        </main>
        <footer className="admin-footer">
          <span>{content.name} · A little heart in every frame.</span>
          <a href="/" target="_blank" rel="noreferrer">
            Open your website <ArrowUpRight size={13} />
          </a>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      <dialog
        ref={deleteDialogRef}
        className="confirm-dialog"
        aria-labelledby="delete-title"
        onCancel={() => setDeleteId(null)}
      >
        <h3 id="delete-title">Delete this story?</h3>
        <p>
          This removes the album from your content when you save. Photos already
          uploaded to Cloudinary remain in your media library.
        </p>
        <div>
          <button
            className="button button-outline"
            autoFocus
            onClick={() => setDeleteId(null)}
          >
            Keep album
          </button>
          <button
            className="button button-danger"
            onClick={() => {
              edit({
                albums: content.albums.filter((a) => a.id !== deleteId),
              });
              setSelected(
                content.albums.find((a) => a.id !== deleteId)?.id || "",
              );
              setDeleteId(null);
            }}
          >
            Delete album
          </button>
        </div>
      </dialog>
    </div>
  );
}
