import { Star } from "lucide-react";
import { initials } from "../../utils/format";

/** Structural subset of Testimonial — works for list endpoints and the home aggregate. */
export interface TestimonialCardData {
  clientName: string;
  designation: string | null;
  companyName: string | null;
  quote: string;
  rating: number;
}

export function TestimonialCard({ testimonial }: { testimonial: TestimonialCardData }) {
  return (
    <figure className="testimonial-card">
      <span className="testimonial-quote-mark" aria-hidden="true">
        &ldquo;
      </span>
      <div className="testimonial-stars" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={15} fill={i < testimonial.rating ? "currentColor" : "none"} aria-hidden="true" />
        ))}
      </div>
      <blockquote className="testimonial-quote">{testimonial.quote}</blockquote>
      <figcaption className="testimonial-who">
        <span className="testimonial-avatar" aria-hidden="true">
          {initials(testimonial.clientName)}
        </span>
        <div>
          <p className="testimonial-name">{testimonial.clientName}</p>
          <p className="testimonial-role">
            {[testimonial.designation, testimonial.companyName].filter((part) => part !== null && part !== "").join(" · ")}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
