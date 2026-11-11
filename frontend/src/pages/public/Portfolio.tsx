import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ProjectCard } from "../../components/public/ProjectCard";
import { SectionHead } from "../../components/public/SectionHead";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { Pagination } from "../../components/ui/Pagination";
import { useCategories, useProjects } from "../../hooks/public";

const PAGE_SIZE = 9;

export function Portfolio() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, category, sort]);

  const categories = useCategories();
  const projects = useProjects({
    page,
    pageSize: PAGE_SIZE,
    search: debounced === "" ? undefined : debounced,
    category: category === "" ? undefined : category,
    sort,
  });

  return (
    <section className="section" style={{ paddingTop: "calc(76px + clamp(40px, 7vw, 80px))" }}>
      <div className="container">
        <SectionHead
          eyebrow="Portfolio"
          title="Work that earned its case study"
          lede="Every project below shipped. Search, filter, and open any card for the full story."
        />

        <div className="filter-bar">
          <div className="filter-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              className="input"
              placeholder="Search projects, tech, industries…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search projects"
            />
          </div>
          <div className="pill-group" role="group" aria-label="Filter by category">
            <button type="button" className="pill" aria-pressed={category === ""} onClick={() => setCategory("")}>
              All categories
            </button>
            {(categories.data?.data ?? []).map((cat) => (
              <button
                type="button"
                className="pill"
                key={cat.id}
                aria-pressed={category === cat.slug}
                onClick={() => setCategory(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <select className="select" style={{ width: "auto" }} value={sort} onChange={(event) => setSort(event.target.value as "newest" | "oldest")} aria-label="Sort projects">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {projects.isError ? (
          <ErrorState message="Could not load projects." onRetry={() => void projects.refetch()} />
        ) : projects.isLoading ? (
          <LoadingState padded={false} />
        ) : projects.data !== undefined && projects.data.data.length === 0 ? (
          <EmptyState
            title="No projects match"
            message="Try clearing the search or picking a different category."
          />
        ) : (
          <div className="projects-grid">
            {(projects.data?.data ?? []).map((project) => (
              <ProjectCard project={project} key={project.id} />
            ))}
          </div>
        )}

        {projects.data?.meta !== undefined && projects.data.data.length > 0 ? (
          <Pagination meta={projects.data.meta} onChangePage={setPage} />
        ) : null}
      </div>
    </section>
  );
}
