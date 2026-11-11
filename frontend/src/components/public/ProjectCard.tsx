import { Link } from "react-router-dom";
import type { ProjectSummary } from "../../api/types";
import { coverBackground } from "../../utils/cover";
import { DivisionBadge } from "../ui/Badges";

/**
 * Portfolio card. List endpoints do not include image URLs, so the cover is
 * the deterministic procedural gradient for the project — real uploaded
 * covers appear on the detail page and the home carousel.
 */
export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link to={`/projects/${project.slug}`} className="project-card hover-lift" aria-label={`View ${project.title}`}>
      <div className="project-cover" style={{ background: coverBackground(project.slug) }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(1.3rem, 2.6vw, 1.9rem)",
            letterSpacing: "0.04em",
            color: "rgba(247, 247, 251, 0.9)",
            textShadow: "0 4px 30px rgba(0,0,0,0.55)",
          }}
        >
          {project.title}
        </span>
        <div className="project-cover-glow" aria-hidden="true" />
      </div>
      <div className="project-body">
        <div className="project-meta">
          <DivisionBadge division={project.division} short />
          {project.category !== null ? <span className="badge badge-neutral">{project.category.name}</span> : null}
          {project.isFeatured ? <span className="badge badge-violet">Featured</span> : null}
        </div>
        <h3 className="project-title">{project.title}</h3>
        {project.shortDescription !== null ? <p className="project-desc">{project.shortDescription}</p> : null}
        <div className="project-tech">
          {project.technologies.slice(0, 4).map((tech) => (
            <span className="badge badge-neutral" key={tech}>
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 ? (
            <span className="badge badge-neutral">+{project.technologies.length - 4}</span>
          ) : null}
        </div>
      </div>
      <span className="sr-only">View case study</span>
    </Link>
  );
}
