import { AtSign, Briefcase, Camera, Mail, MapPin, MessageCircle, Phone, ThumbsUp, Video } from "lucide-react";
import type { ReactNode } from "react";
import { EnquiryForm } from "../../components/public/EnquiryForm";
import { SectionHead } from "../../components/public/SectionHead";
import { useSiteSettings } from "../../hooks/public";

function ContactRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="contact-row">
      <span className="contact-row-icon">{icon}</span>
      <div>
        <p className="contact-row-label">{label}</p>
        <p className="contact-row-value">{children}</p>
      </div>
    </div>
  );
}

interface SocialLink {
  href: string;
  label: string;
  icon: ReactNode;
}

export function Contact() {
  const settings = useSiteSettings();
  const data = settings.data;

  const socials: SocialLink[] = [];
  if (data?.socialInstagram !== null && data?.socialInstagram !== undefined && data.socialInstagram !== "")
    socials.push({ href: data.socialInstagram, label: "Instagram", icon: <Camera size={17} aria-hidden="true" /> });
  if (data?.socialLinkedIn !== null && data?.socialLinkedIn !== undefined && data.socialLinkedIn !== "")
    socials.push({ href: data.socialLinkedIn, label: "LinkedIn", icon: <Briefcase size={17} aria-hidden="true" /> });
  if (data?.socialX !== null && data?.socialX !== undefined && data.socialX !== "")
    socials.push({ href: data.socialX, label: "X", icon: <AtSign size={17} aria-hidden="true" /> });
  if (data?.socialFacebook !== null && data?.socialFacebook !== undefined && data.socialFacebook !== "")
    socials.push({ href: data.socialFacebook, label: "Facebook", icon: <ThumbsUp size={17} aria-hidden="true" /> });
  if (data?.socialYoutube !== null && data?.socialYoutube !== undefined && data.socialYoutube !== "")
    socials.push({ href: data.socialYoutube, label: "YouTube", icon: <Video size={17} aria-hidden="true" /> });

  return (
    <section className="section" style={{ paddingTop: "calc(76px + clamp(40px, 7vw, 80px))" }}>
      <div className="container">
        <SectionHead
          eyebrow="Contact"
          title="Tell us what you are building"
          lede="Fill in the brief and a strategist replies within one business day — or reach us directly on any channel below."
        />

        <div className="contact-grid">
          <div className="glass contact-info-card">
            {data?.contactEmail !== null && data?.contactEmail !== undefined ? (
              <ContactRow icon={<Mail size={20} aria-hidden="true" />} label="Email">
                <a href={`mailto:${data.contactEmail}`}>{data.contactEmail}</a>
              </ContactRow>
            ) : null}
            {data?.contactPhone !== null && data?.contactPhone !== undefined ? (
              <ContactRow icon={<Phone size={20} aria-hidden="true" />} label="Phone">
                <a href={`tel:${data.contactPhone}`}>{data.contactPhone}</a>
              </ContactRow>
            ) : null}
            {data?.whatsappNumber !== null && data?.whatsappNumber !== undefined ? (
              <ContactRow icon={<MessageCircle size={20} aria-hidden="true" />} label="WhatsApp">
                <a
                  href={`https://wa.me/${data.whatsappNumber.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {data.whatsappNumber}
                </a>
              </ContactRow>
            ) : null}
            {data?.address !== null && data?.address !== undefined ? (
              <ContactRow icon={<MapPin size={20} aria-hidden="true" />} label="Studio">
                {data.address}
              </ContactRow>
            ) : null}
            {socials.length > 0 ? (
              <div>
                <p className="footer-heading" style={{ marginBottom: "var(--space-3)" }}>Elsewhere</p>
                <div className="footer-socials">
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn-icon"
                      aria-label={`${social.label} (opens in a new tab)`}
                      style={{ width: 42, height: 42 }}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="glass-strong contact-form-card">
            <EnquiryForm sourcePage="/contact" />
          </div>
        </div>
      </div>
    </section>
  );
}
