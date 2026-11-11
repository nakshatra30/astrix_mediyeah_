import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, ExternalLink, FolderGit2, Layers } from "lucide-react";
import { CtaBand } from "../../components/public/CtaBand";
import { btnClasses } from "../../components/ui/Button";
import { DivisionBadge } from "../../components/ui/Badges";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { RichText } from "../../components/ui/RichText";
import { useProject } from "../../hooks/public";
import { coverBackground } from "../../utils/cover";
import { formatDate } from "../../utils/format";

export function ProjectDetailPage() {
  const { slug = "" } = useParams();
  const project = useProject(slug);

  if (project.isLoading) {
    return (
      <div className="pd-hero">
        <div className="container">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (project.isError || project.data === undefined) {
    return (
      <div className="pd-hero">
        <div className="container">
          <ErrorState
            message="This project could not be found. It may have been unpublished or renamed."
            onRetry={() => void project.refetch()}
          />
          <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-4)" }}>
            <Link to="/portfolio" className={btnClasses("glass")}>
              <ArrowLeft size={15} aria-hidden="true" /> Back to portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const data = project.data;
  const cover = data.images[0] ?? null;
  const gallery = data.images.slice(1);

  return (
    <>
      <div className="pd-hero">
        <div className="container">
          <Link to="/portfolio" className="pd-back">
            <ArrowLeft size={15} aria-hidden="true" /> Portfolio
          </Link>
          <div className="project-meta">
            <DivisionBadge division={data.division} short />
            {data.category !== null ? <span className="badge badge-neutral">{data.category.name}</span> : null}
            {data.isFeatured ? <span className="badge badge-violet">Featured</span> : null}
          </div>
          <h1 className="pd-title">{data.title}</h1>
          {data.shortDescription !== null ? <p className="section-lede">{data.shortDescription}</p> : null}

          <div className="pd-cover">
            {cover !== null ? (
              <img src={cover.mediaAsset.url} alt={cover.altText ?? `${data.title} cover`} />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: coverBackground(data.slug),
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "clamp(1.6rem, 4vw, 3rem)",
                  letterSpacing: "0.05em",
                  color: "rgba(247, 247, 251, 0.92)",
                  textShadow: "0 6px 40px rgba(0,0,0,0.6)",
                }}
              >
                {data.title}
              </div>
            )}
          </div>

          <div className="pd-layout">
            <div>
              <div className="pd-section">
                <h2 className="pd-section-title">Overview</h2>
                {data.fullDescription !== null ? (
                  <RichText html={data.fullDescription} />
                ) : (
                  <p className="muted">{data.shortDescription}</p>
                )}
              </div>

              {data.challenge !== null ? (
                <div className="pd-section">
                  <h2 className="pd-section-title">The challenge</h2>
                  <RichText html={data.challenge} />
                </div>
              ) : null}

              {data.solution !== null ? (
                <div className="pd-section">
                  <h2 className="pd-section-title">What we built</h2>
                  <RichText html={data.solution} />
                </div>
              ) : null}

              {data.process !== null ? (
                <div className="pd-section">
                  <h2 className="pd-section-title">How it ran</h2>
                  <RichText html={data.process} />
                </div>
              ) : null}

              {gallery.length > 0 ? (
                <div className="pd-section">
                  <h2 className="pd-section-title">Gallery</h2>
                  <div className="pd-gallery">
                    {gallery.map((image) => (
                      <div className="pd-gallery-item" key={image.id}>
                        <img src={image.mediaAsset.url} alt={image.altText ?? `${data.title} detail`} loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="pd-aside">
              <div className="pd-fact">
                <p className="pd-fact-label">Division</p>
                <p className="pd-fact-value">
                  <DivisionBadge division={data.division} short />
                </p>
              </div>
              {data.category !== null ? (
                <div className="pd-fact">
                  <p className="pd-fact-label">Category</p>
                  <p className="pd-fact-value">
                    <Layers size={13} aria-hidden="true" /> {data.category.name}
                  </p>
                </div>
              ) : null}
              <div className="pd-fact">
                <p className="pd-fact-label">Delivered</p>
                <p className="pd-fact-value">
                  <Calendar size={13} aria-hidden="true" /> {formatDate(data.createdAt)}
                </p>
              </div>
              {data.technologies.length > 0 ? (
                <div className="pd-fact">
                  <p className="pd-fact-label">Stack</p>
                  <div className="project-tech" style={{ marginTop: 4 }}>
                    {data.technologies.map((tech) => (
                      <span className="badge badge-neutral" key={tech}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {data.projectUrl !== null ? (
                <a href={data.projectUrl} target="_blank" rel="noreferrer noopener" className={btnClasses("primary")}>
                  Visit live site <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
              {data.repositoryUrl !== null ? (
                <a href={data.repositoryUrl} target="_blank" rel="noreferrer noopener" className={btnClasses("glass")}>
                  View repository <FolderGit2 size={14} aria-hidden="true" />
                </a>
              ) : null}
              <Link to="/contact" className={btnClasses("ghost")}>
                Start a similar project
              </Link>
            </aside>
          </div>
        </div>
      </div>

      <CtaBand title="Want results like this?" />
    </>
  );
}
