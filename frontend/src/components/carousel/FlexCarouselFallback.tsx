import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { coverBackground } from "../../utils/cover";
import type { FlexCarouselItem } from "./FlexCarousel";

/**
 * Scroll-snap DOM fallback used when WebGL2 is unavailable or the visitor
 * prefers reduced motion. Same data and affordances (drag, wheel, dots);
 * autoplay stays on unless reduced motion is requested.
 */
export function FlexCarouselFallback({ items }: { items: FlexCarouselItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const indexRef = useRef(0);

  const scrollToIndex = useCallback((next: number) => {
    const track = trackRef.current;
    if (track === null || track.children.length === 0) return;
    const clamped = ((next % items.length) + items.length) % items.length;
    const child = track.children.item(clamped);
    if (child instanceof HTMLElement) {
      child.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (track === null) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slide = track.children.item(0);
        const width = slide instanceof HTMLElement ? slide.offsetWidth : 1;
        const next = width > 0 ? Math.round(track.scrollLeft / width) : 0;
        if (next !== indexRef.current) {
          indexRef.current = next;
          setIndex(next);
        }
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const reduced = useRef(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (reduced.current || paused || items.length < 2) return;
    const id = window.setInterval(() => scrollToIndex(indexRef.current + 1), 4500);
    return () => window.clearInterval(id);
  }, [paused, items.length, scrollToIndex]);

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") scrollToIndex(index + 1);
    if (event.key === "ArrowLeft") scrollToIndex(index - 1);
  };

  return (
    <div
      className="fc-root"
      role="region"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={onKey}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="fc-fallback" ref={trackRef}>
        {items.map((item, i) => (
          <article
            key={item.slug}
            className={`fc-fallback-card${i === index ? " active" : ""}`}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}`}
          >
            {item.image ? (
              <img src={item.image} alt={item.title} loading="lazy" />
            ) : (
              <div className="fc-fallback-gradient" style={{ background: coverBackground(item.slug) }} aria-hidden="true" />
            )}
            <Link to={item.href} className="fc-fallback-caption">
              <p className="fc-fallback-title">{item.title}</p>
              {item.subtitle ? <p className="fc-fallback-sub">{item.subtitle}</p> : null}
            </Link>
          </article>
        ))}
      </div>
      <div className="fc-dots" style={{ position: "static", translate: "none", justifyContent: "center", marginTop: 10 }} role="tablist" aria-label="Choose slide">
        {items.map((item, i) => (
          <button
            key={item.slug}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${item.title}`}
            className={`fc-dot${i === index ? " active" : ""}`}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
