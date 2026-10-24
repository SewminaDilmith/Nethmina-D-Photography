import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
  Menu,
  Camera,
  Mail,
  Phone,
  MapPin,
  Plus,
  Minus,
  Check,
  Loader2,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { defaultContent } from "../lib/demo";
import {
  demoAllowed,
  isLive,
  loadContent,
  submitInquiry,
} from "../lib/backend";
import { categories, type Album, type SiteContent } from "../lib/types";
import ThemeToggle from "./ThemeToggle";

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 1, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65, ease: [0.2, 0.65, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
export default function Portfolio() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  // Two loose photographic prints settle into a straight composition as you scroll.
  const mainRotate = useTransform(heroProgress, [0, 0.4, 1], [-1.4, 0, 0]);
  const mainY = useTransform(heroProgress, [0, 0.4, 1], [12, 0, 0]);
  const sideRotate = useTransform(heroProgress, [0, 0.4, 1], [3, 0, 0]);
  const sideY = useTransform(heroProgress, [0, 0.4, 1], [54, 0, 0]);
  const imageScale = useTransform(
    heroProgress,
    [0, 0.65, 1],
    [1.12, 1.06, 1.06],
  );
  const imageY = useTransform(heroProgress, [0, 1], [0, 10]);
  const stampRotate = useTransform(heroProgress, [0, 0.65, 1], [12, -8, -8]);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [filter, setFilter] = useState("All work");
  const [mobile, setMobile] = useState(false);
  const [album, setAlbum] = useState<Album | null>(null);
  const [photo, setPhoto] = useState<number | null>(null);
  const [service, setService] = useState<number | null>(0);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const touchStart = useRef<number | null>(null);
  useEffect(() => {
    const refresh = () =>
      loadContent()
        .then((data) => {
          setContent(data);
          setLoaded(true);
          document.title = `${data.name} — Photography for the moments you want to keep`;
        })
        .catch(() => {
          setLoaded(true);
          setStatus(
            "Some content could not be refreshed. Please try again later.",
          );
        });
    refresh();
    window.addEventListener("content-updated", refresh);
    return () => window.removeEventListener("content-updated", refresh);
  }, []);
  useEffect(() => {
    document.body.style.overflow = album ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [album]);
  useEffect(() => {
    if (album) dialogRef.current?.showModal();
    else if (dialogRef.current?.open) dialogRef.current.close();
  }, [album]);
  useEffect(() => {
    if (photo !== null) lightboxRef.current?.showModal();
    else if (lightboxRef.current?.open) lightboxRef.current.close();
  }, [photo]);
  const closeAlbum = () => {
    setPhoto(null);
    setAlbum(null);
    returnFocus.current?.focus();
  };
  const openAlbum = (item: Album) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setAlbum(item);
    const url = new URL(window.location.href);
    url.searchParams.set("album", item.id);
    window.history.replaceState({}, "", url);
  };
  const dismissAlbum = () => {
    closeAlbum();
    const url = new URL(window.location.href);
    url.searchParams.delete("album");
    window.history.replaceState({}, "", url);
  };
  useEffect(() => {
    if (!loaded) return;
    const id = new URLSearchParams(window.location.search).get("album");
    if (id) {
      const selected = content.albums.find((a) => a.id === id && a.published);
      if (selected) setAlbum(selected);
    }
  }, [loaded]);
  const published = content.albums.filter(
    (a) => a.published && a.photos.length,
  );
  const filtered = published.filter(
    (a) => filter === "All work" || a.category === filter,
  );
  async function contact(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (values.get("website")) return;
    setSending(true);
    setStatus("");
    try {
      await submitInquiry({
        name: String(values.get("name")).trim(),
        email: String(values.get("email")).trim(),
        type: String(values.get("type")),
        date: String(values.get("date")),
        location: String(values.get("location")).trim(),
        message: String(values.get("message")).trim(),
      });
      setSent(true);
      form.reset();
    } catch (e) {
      setStatus(
        e instanceof Error
          ? e.message
          : "Could not send your enquiry. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <>
      <header className="site-header">
        <a
          className="wordmark brand-logo"
          href="#home"
          aria-label={`${content.name} home`}
        >
          <img
            src="/images/nethmina-d-logo.png"
            alt={content.name}
            width="2000"
            height="545"
          />
        </a>
        <nav
          className={mobile ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          {[
            ["The work", "#work"],
            ["The approach", "#about"],
            ["Services", "#services"],
          ].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMobile(false)}>
              {label}
            </a>
          ))}
          <a
            className="nav-cta"
            href="#contact"
            onClick={() => setMobile(false)}
          >
            Let's make memories <ArrowUpRight size={15} />
          </a>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <button
            className="mobile-menu icon-button"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <section ref={heroRef} className="hero page-width" id="home">
          <div className="hero-heading">
            <Reveal>
              <div className="eyebrow">
                <span className="tiny-sun">✳</span> REAL PEOPLE. REAL MOMENTS.
              </div>
              <h1>
                {content.tagline.split("\n").map((line, i) => (
                  <span key={i}>{i === 1 ? <em>{line}</em> : line}</span>
                ))}
              </h1>
            </Reveal>
            <Reveal className="hero-note">
              <p>{content.intro}</p>
              <a className="text-link" href="#work">
                Explore the stories <ArrowDown size={17} />
              </a>
            </Reveal>
          </div>
          <div className="hero-visual">
            <motion.div
              className="hero-main"
              style={
                reducedMotion ? undefined : { rotate: mainRotate, y: mainY }
              }
            >
              <motion.img
                src={content.hero}
                alt="A wedding celebration, captured in natural light"
                fetchPriority="high"
                width="1600"
                height="1100"
                style={
                  reducedMotion ? undefined : { scale: imageScale, y: imageY }
                }
              />
              <div className="image-shade" />
              <div className="hero-caption">
                <span>A MOMENT. A FEELING. A STORY.</span>
                <p>
                  Some things deserve
                  <br />
                  to be remembered.
                </p>
              </div>
              <a
                className="round-link"
                href="#work"
                aria-label="Explore the photography portfolio"
              >
                <ArrowUpRight size={29} />
              </a>
            </motion.div>
            <motion.div
              className="hero-side"
              style={
                reducedMotion ? undefined : { rotate: sideRotate, y: sideY }
              }
            >
              <img
                src="/images/couple.jpg"
                alt="A couple sharing a quiet moment"
                width="800"
                height="1100"
              />
              <div className="side-label">
                <span>THE BEAUTY IN BETWEEN</span>
                <span>01 — 06</span>
              </div>
            </motion.div>
            <motion.div
              className="hero-stamp"
              style={reducedMotion ? undefined : { rotate: stampRotate }}
            >
              <span>MADE OF LITTLE MOMENTS</span>
              <span className="stamp-star">✳</span>
              <span>KEPT FOR A LIFETIME</span>
            </motion.div>
          </div>
          <div className="hero-bottom">
            <span>WEDDINGS · CELEBRATIONS · PORTRAITS</span>
            <span>Honest stories, thoughtfully told.</span>
          </div>
        </section>
        <section className="work-section page-width section-space" id="work">
          <Reveal className="section-heading">
            <div>
              <div className="eyebrow">A FEW STORIES I'VE TOLD</div>
              <h2>
                Life happens.
                <br />
                <em>Let's keep a little of it.</em>
              </h2>
            </div>
            <p>
              Different people, different chapters.
              <br />
              The same feeling of wanting to remember.
            </p>
          </Reveal>
          <div
            className="filter-row"
            role="group"
            aria-label="Filter portfolio"
          >
            {["All work", ...categories].map((cat) => (
              <button
                key={cat}
                className={filter === cat ? "filter active" : "filter"}
                aria-pressed={filter === cat}
                onClick={() => setFilter(cat)}
              >
                {cat}
                {filter === cat && <span className="filter-dot" />}
              </button>
            ))}
            <span className="work-count">
              {String(filtered.length).padStart(2, "0")} STORIES
            </span>
          </div>
          <div className="portfolio-grid">
            {filtered.map((item, index) => (
              <Reveal key={item.id} className="portfolio-item">
                <button
                  className="album-card"
                  onClick={() => openAlbum(item)}
                  aria-label={`View ${item.title} album`}
                >
                  <div className="card-image">
                    <img
                      src={item.photos[0].url}
                      alt={item.photos[0].alt || item.title}
                      loading="lazy"
                      width="900"
                      height="1100"
                    />
                    <span className="category-pill">{item.category}</span>
                    <span className="card-open">
                      <ArrowUpRight size={22} />
                    </span>
                  </div>
                  <div className="card-caption">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.location}</p>
                    </div>
                    <span className="card-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="empty-state">
              A new story is on its way. Explore another collection in the
              meantime.
            </p>
          )}
        </section>
        <section className="about-section section-space" id="about">
          <div className="page-width about-grid">
            <Reveal className="about-photo">
              <img
                src={content.aboutImage}
                alt="A camera ready to capture the next story"
                loading="lazy"
                width="1000"
                height="1200"
              />
              <span className="photo-note">
                A camera. A little curiosity. Your story.
              </span>
            </Reveal>
            <Reveal className="about-copy">
              <div className="eyebrow">THE PERSON BEHIND THE LENS</div>
              <h2>
                A calm presence.
                <br />
                <em>A curious eye.</em>
              </h2>
              {content.about.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <a href="#contact" className="text-link">
                A good story starts with hello <ArrowUpRight size={18} />
              </a>
              <div className="about-signature">
                {content.name}
                <span>with a little heart in every frame.</span>
              </div>
            </Reveal>
          </div>
        </section>
        <section
          className="services-section page-width section-space"
          id="services"
        >
          <Reveal className="section-heading">
            <div>
              <div className="eyebrow">WHATEVER YOUR CHAPTER</div>
              <h2>
                There's a story
                <br />
                <em>in every occasion.</em>
              </h2>
            </div>
            <p>
              Tell me what you have in mind.
              <br />
              We'll make something that feels like you.
            </p>
          </Reveal>
          <div className="services-list">
            {content.services.map((item, index) => (
              <Reveal key={item.name}>
                <div
                  className={`service ${service === index ? "expanded" : ""}`}
                >
                  <button
                    aria-expanded={service === index}
                    aria-controls={`service-${index}`}
                    onClick={() => setService(service === index ? null : index)}
                  >
                    <span className="service-number">{item.number}</span>
                    <h3>{item.name}</h3>
                    <span className="service-line">{item.line}</span>
                    {service === index ? (
                      <Minus size={21} />
                    ) : (
                      <Plus size={21} />
                    )}
                  </button>
                  <div
                    id={`service-${index}`}
                    hidden={service !== index}
                    className="service-detail"
                  >
                    <p>{item.detail}</p>
                    <a
                      className="text-link"
                      href={`#contact`}
                      onClick={() => {
                        const select =
                          document.querySelector<HTMLSelectElement>(
                            "#enquiry-type",
                          );
                        if (select) select.value = item.name;
                      }}
                    >
                      Enquire about {item.name.toLowerCase()}{" "}
                      <ArrowUpRight size={16} />
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="process-section page-width">
          <div className="eyebrow">SIMPLE FROM THE FIRST HELLO</div>
          <div className="process-grid">
            {[
              [
                "01",
                "Let's talk",
                "Tell me about your day, your people, and what you'd love to remember.",
              ],
              [
                "02",
                "Make a little plan",
                "We'll work through the details so you can turn up and be yourself.",
              ],
              [
                "03",
                "Keep the feeling",
                "A thoughtful collection of photographs, ready to return to.",
              ],
            ].map(([num, title, text]) => (
              <Reveal key={num}>
                <span className="process-number">{num}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="contact-section section-space" id="contact">
          <div className="page-width contact-grid">
            <Reveal className="contact-copy">
              <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
              <h2>
                Something
                <br />
                worth keeping?
                <br />
                <em>Let's talk.</em>
              </h2>
              <p>
                A date in the diary, an idea in your head, or just a question.
                I'd love to hear it.
              </p>
              <div className="contact-links">
                <span>
                  <MapPin size={17} />
                  {content.location}
                </span>
                {content.email && (
                  <a href={`mailto:${content.email}`}>
                    <Mail size={17} />
                    {content.email}
                  </a>
                )}
                {content.phone && (
                  <a href={`tel:${content.phone.replace(/[^+\d]/g, "")}`}>
                    <Phone size={17} />
                    {content.phone}
                  </a>
                )}
                {content.whatsapp && (
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://wa.me/${content.whatsapp.replace(/\D/g, "")}`}
                  >
                    Say hello on WhatsApp <ArrowUpRight size={16} />
                  </a>
                )}
                {content.instagram && (
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://instagram.com/${content.instagram.replace(/^@/, "")}`}
                  >
                    <Camera size={17} />
                    Follow the little moments
                  </a>
                )}
              </div>
            </Reveal>
            <Reveal className="contact-form-wrap">
              {sent ? (
                <div className="success-message" role="status">
                  <span className="success-icon">
                    <Check size={28} />
                  </span>
                  <h3>
                    {isLive
                      ? "Your story is on its way."
                      : "Your demo enquiry is saved."}
                  </h3>
                  <p>
                    {isLive
                      ? "Thank you for getting in touch. Your enquiry has been received."
                      : "This enquiry was saved in this browser only. You can see it in the demo dashboard; no message was delivered."}
                  </p>
                  <button className="button" onClick={() => setSent(false)}>
                    Send another enquiry <ArrowUpRight size={17} />
                  </button>
                </div>
              ) : (
                <form onSubmit={contact}>
                  <div className="form-top">
                    <span>A LITTLE ABOUT YOUR PLANS</span>
                    <span>↗</span>
                  </div>
                  <div className="form-grid">
                    <label>
                      Your name
                      <input
                        name="name"
                        required
                        maxLength={100}
                        autoComplete="name"
                        placeholder="The name behind the story"
                      />
                    </label>
                    <label>
                      Email address
                      <input
                        type="email"
                        name="email"
                        required
                        maxLength={200}
                        autoComplete="email"
                        placeholder="Somewhere I can say hello"
                      />
                    </label>
                    <label>
                      What are we celebrating?
                      <select
                        id="enquiry-type"
                        name="type"
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Choose your occasion
                        </option>
                        {categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                        <option>Something else</option>
                      </select>
                    </label>
                    <label>
                      When is it?
                      <input
                        type="date"
                        name="date"
                        aria-label="Preferred shoot date"
                        min={new Date().toISOString().slice(0, 10)}
                      />
                    </label>
                  </div>
                  <label>
                    Where do you have in mind?
                    <input
                      name="location"
                      maxLength={200}
                      placeholder="A venue, a city, or somewhere special"
                    />
                  </label>
                  <label>
                    Tell me a little more
                    <textarea
                      name="message"
                      required
                      minLength={10}
                      maxLength={3000}
                      rows={3}
                      placeholder="Your plans, your people, the feeling you're after…"
                    />
                  </label>
                  <div className="honeypot" aria-hidden="true">
                    <label>
                      Leave this empty
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  <button
                    className="button full-width"
                    disabled={sending || (!isLive && !demoAllowed)}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="spin" size={17} />
                        Sending your story…
                      </>
                    ) : (
                      <>
                        Let's make a memory <ArrowUpRight size={19} />
                      </>
                    )}
                  </button>
                  <p className="form-note">
                    {!isLive
                      ? "Demo form · Enquiries stay in this browser until Firebase is connected."
                      : "Your details are used to respond to your enquiry. Please don't include sensitive information."}
                  </p>
                  {status && (
                    <p role="alert" className="error-message">
                      {status}
                    </p>
                  )}
                </form>
              )}
            </Reveal>
          </div>
        </section>
      </main>
      <footer className="page-width">
        <div className="footer-top">
          <a className="wordmark brand-logo" href="#home" aria-label={`${content.name} home`}>
            <img
              src="/images/nethmina-d-logo.png"
              alt={content.name}
              width="2000"
              height="545"
              loading="lazy"
            />
          </a>
          <p>Real moments. Beautifully remembered.</p>
          <a className="text-link" href="#home">
            Back to the top <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {content.name}
          </span>
          <span>
            {!isLive
              ? "Sample portfolio · Illustrative photos and studio copy"
              : ""}
          </span>
          <a href="/admin">
            Studio login <ArrowUpRight size={12} />
          </a>
        </div>
      </footer>
      <dialog
        ref={dialogRef}
        className="album-dialog"
        aria-labelledby="album-title"
        onCancel={(e) => {
          e.preventDefault();
          dismissAlbum();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) dismissAlbum();
        }}
      >
        {album && (
          <div className="album-dialog-inner">
            <button
              className="close-dialog icon-button"
              aria-label="Close album"
              onClick={dismissAlbum}
            >
              <X />
            </button>
            <div className="eyebrow">
              {album.category} · {album.location}
            </div>
            <h2 id="album-title">{album.title}</h2>
            <p className="album-description">{album.description}</p>
            <div className="album-photos">
              {album.photos.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setPhoto(index)}
                  aria-label={`Open photograph ${index + 1}: ${item.alt}`}
                >
                  <img src={item.url} alt={item.alt} loading="lazy" />
                </button>
              ))}
            </div>
            <a href="#contact" className="button" onClick={dismissAlbum}>
              Let's tell your story <ArrowUpRight size={18} />
            </a>
          </div>
        )}
      </dialog>
      <dialog
        ref={lightboxRef}
        className="lightbox"
        aria-label="Fullscreen photo viewer"
        onCancel={(e) => {
          e.preventDefault();
          setPhoto(null);
        }}
        onKeyDown={(e) => {
          if (photo === null || !album) return;
          if (e.key === "ArrowRight")
            setPhoto((photo + 1) % album.photos.length);
          if (e.key === "ArrowLeft")
            setPhoto((photo - 1 + album.photos.length) % album.photos.length);
        }}
      >
        {album && photo !== null && (
          <div
            className="lightbox-content"
            onTouchStart={(e) => {
              touchStart.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStart.current === null) return;
              const distance = e.changedTouches[0].clientX - touchStart.current;
              if (Math.abs(distance) > 50)
                setPhoto(
                  (photo + (distance < 0 ? 1 : -1) + album.photos.length) %
                    album.photos.length,
                );
              touchStart.current = null;
            }}
          >
            <button
              className="lightbox-close icon-button"
              onClick={() => setPhoto(null)}
              aria-label="Close photograph"
            >
              <X />
            </button>
            <button
              className="lightbox-prev icon-button"
              aria-label="Previous photograph"
              onClick={() =>
                setPhoto(
                  (photo - 1 + album.photos.length) % album.photos.length,
                )
              }
            >
              <ArrowLeft />
            </button>
            <img src={album.photos[photo].url} alt={album.photos[photo].alt} />
            <button
              className="lightbox-next icon-button"
              aria-label="Next photograph"
              onClick={() => setPhoto((photo + 1) % album.photos.length)}
            >
              <ArrowRight />
            </button>
            <p>
              {album.photos[photo].alt}{" "}
              <span>
                {photo + 1} / {album.photos.length}
              </span>
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
