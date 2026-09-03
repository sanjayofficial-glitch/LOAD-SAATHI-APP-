import { useState, useEffect } from 'react';
import { Linkedin, Twitter, Instagram, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../integrations/supabase/client';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  phone?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

const TEAM_PHOTOS: Record<string, string> = {
  'Sanjaya Sahu': '/team/sanjaya-sahu.webp',
  'Prince Mallik': '/team/prince-mallik.webp',
  'Jaydev Suna': '/team/jaydev-suna.webp',
  TBD: '/team/jaydev-suna.webp',
};

function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        const mapped: TeamMember[] = (data || []).map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          image: TEAM_PHOTOS[m.name] ?? `https://i.pravatar.cc/400?u=${m.id}`,
          phone: m.phone,
          social: {
            linkedin: m.linkedin || undefined,
            twitter: m.twitter || undefined,
            instagram: m.instagram || undefined,
          },
        }));
        setMembers(mapped);
      } catch {
        setMembers([
          { id: '1', name: 'Sanjaya Sahu', role: 'Founder & CEO', image: '/team/sanjaya-sahu.webp', phone: '+918328998031', social: { linkedin: 'https://www.linkedin.com/in/sanjaya-sahu-253315305/' } },
          { id: '2', name: 'Prince Mallik', role: 'Co-Founder & COO', image: '/team/prince-mallik.webp', phone: '+91 76848 43985', social: { linkedin: 'https://www.linkedin.com/in/prince-mallik-177a472a0/' } },
          { id: '3', name: 'Jaydev Suna', role: 'Customer Executive', image: '/team/jaydev-suna.webp', social: { linkedin: 'https://www.linkedin.com/in/jaydev-suna-658802414/' } },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return { members, loading };
}

export default function TeamShowcase() {
  const { members } = useTeamMembers();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const col1 = members.filter((_, i) => i % 3 === 0);
  const col2 = members.filter((_, i) => i % 3 === 1);
  const col3 = members.filter((_, i) => i % 3 === 2);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10 lg:gap-14 select-none w-full max-w-5xl mx-auto py-8 px-4 md:px-6 font-sans">
      {/* Left: photo grid */}
      <div className="w-full md:w-auto md:flex-shrink-0">
        {/* Mobile: 3 photos in a row, centered */}
        <div className="flex md:hidden gap-3 justify-center">
          {members.map((member) => (
            <PhotoCard
              key={member.id}
              member={member}
              defaultClass="w-[140px] h-[190px]"
              expandedClass="w-[200px] h-[270px]"
              hoveredId={hoveredId}
              expandedId={expandedId}
              onHover={setHoveredId}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* Desktop: staggered 3-column grid */}
        <div className="hidden md:flex gap-4">
          <div className="flex flex-col gap-4">
            {col1.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                defaultClass="w-[220px] h-[300px]"
                expandedClass="w-[290px] h-[400px]"
                hoveredId={hoveredId}
                expandedId={expandedId}
                onHover={setHoveredId}
                onToggle={handleToggle}
              />
            ))}
          </div>
          <div className="flex flex-col gap-4 mt-[68px]">
            {col2.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                defaultClass="w-[230px] h-[315px]"
                expandedClass="w-[300px] h-[415px]"
                hoveredId={hoveredId}
                expandedId={expandedId}
                onHover={setHoveredId}
                onToggle={handleToggle}
              />
            ))}
          </div>
          <div className="flex flex-col gap-4 mt-[32px]">
            {col3.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                defaultClass="w-[215px] h-[290px]"
                expandedClass="w-[285px] h-[385px]"
                hoveredId={hoveredId}
                expandedId={expandedId}
                onHover={setHoveredId}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: member name list */}
      <div className="flex flex-col gap-4 md:gap-5 pt-2 md:pt-2 flex-1 w-full">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            hoveredId={hoveredId}
            expandedId={expandedId}
            onHover={setHoveredId}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Photo card ─── */

function PhotoCard({
  member,
  defaultClass,
  expandedClass,
  hoveredId,
  expandedId,
  onHover,
  onToggle,
}: {
  member: TeamMember;
  defaultClass: string;
  expandedClass: string;
  hoveredId: string | null;
  expandedId: string | null;
  onHover: (id: string | null) => void;
  onToggle: (id: string) => void;
}) {
  const isHovered = hoveredId === member.id;
  const isExpanded = expandedId === member.id;
  const isActive = isHovered || isExpanded;
  const isDimmed = hoveredId !== null && !isHovered;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl cursor-pointer flex-shrink-0 transition-all duration-300 ease-smooth relative',
        isExpanded ? expandedClass : defaultClass,
        isDimmed && !isExpanded && 'opacity-70 scale-[0.95]',
        !isDimmed && !isExpanded && 'opacity-100 scale-100',
        isExpanded && 'z-10 shadow-2xl',
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onToggle(member.id)}
    >
      <img
        src={member.image}
        alt={member.name}
        className="w-full h-full object-cover object-top transition-[filter] duration-500"
        style={{
          filter: isActive ? 'grayscale(0) brightness(1) saturate(1.1)' : 'grayscale(0.5) brightness(0.85)',
        }}
      />

      {/* Contact overlay — only visible when expanded (clicked) */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10 transition-opacity duration-400',
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <p className="text-white text-xs font-bold leading-tight truncate">{member.name}</p>
        <p className="text-white/70 text-[9px] uppercase tracking-wider mt-0.5">{member.role}</p>

        {/* Phone */}
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 mt-2 text-white/90 hover:text-white text-[10px] transition-colors"
          >
            <Phone className="w-2.5 h-2.5" />
            <span>{member.phone}</span>
          </a>
        )}

        {/* Social icons */}
        <div className="flex items-center gap-2 mt-1.5">
          {member.social?.linkedin && (
            <a
              href={member.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-white/70 hover:text-white transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-3 h-3" />
            </a>
          )}
          {member.social?.twitter && (
            <a
              href={member.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-white/70 hover:text-white transition-colors"
              title="X / Twitter"
            >
              <Twitter className="w-3 h-3" />
            </a>
          )}
          {member.social?.instagram && (
            <a
              href={member.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-white/70 hover:text-white transition-colors"
              title="Instagram"
            >
              <Instagram className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Member name section ─── */

function MemberRow({
  member,
  hoveredId,
  expandedId,
  onHover,
  onToggle,
}: {
  member: TeamMember;
  hoveredId: string | null;
  expandedId: string | null;
  onHover: (id: string | null) => void;
  onToggle: (id: string) => void;
}) {
  const isHovered = hoveredId === member.id;
  const isExpanded = expandedId === member.id;
  const isDimmed = hoveredId !== null && !isHovered;
  const hasSocial = member.social?.twitter ?? member.social?.linkedin ?? member.social?.instagram;

  return (
    <div
      className={cn(
        'cursor-pointer transition-opacity duration-300',
        isDimmed ? 'opacity-50' : 'opacity-100',
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onToggle(member.id)}
    >
      {/* Name + social */}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'w-4 h-3 rounded-[5px] flex-shrink-0 transition-all duration-300',
            isHovered || isExpanded ? 'bg-foreground w-5' : 'bg-foreground/25',
          )}
        />
        <span
          className={cn(
            'text-[15px] md:text-[18px] font-semibold leading-none tracking-tight transition-colors duration-300',
            isHovered || isExpanded ? 'text-foreground' : 'text-foreground/80',
          )}
        >
          {member.name}
        </span>

        {/* Social icons */}
        {hasSocial && (
          <div
            className={cn(
              'flex items-center gap-1.5 ml-0.5 transition-all duration-200',
              isHovered || isExpanded
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-2 pointer-events-none',
            )}
          >
            {member.social?.twitter && (
              <a
                href={member.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-150 hover:scale-110"
                title="X / Twitter"
              >
                <Twitter className="h-2.5 w-2.5" />
              </a>
            )}
            {member.social?.linkedin && (
              <a
                href={member.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-150 hover:scale-110"
                title="LinkedIn"
              >
                <Linkedin className="h-2.5 w-2.5" />
              </a>
            )}
            {member.social?.instagram && (
              <a
                href={member.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-150 hover:scale-110"
                title="Instagram"
              >
                <Instagram className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Role */}
      <p className="mt-1.5 pl-[27px] text-[9px] md:text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {member.role}
      </p>
    </div>
  );
}
