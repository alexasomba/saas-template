import { Link } from "@tanstack/react-router";
import { MapPin } from "@phosphor-icons/react";

import { type Speaker } from "../../.content-collections/generated";

import { Card, CardContent } from "@workspace/ui/components/card";

interface SpeakerCardProps {
  speaker: Speaker;
  featured?: boolean;
}

export default function SpeakerCard({ speaker, featured = false }: SpeakerCardProps) {
  return (
    <Link to="/speakers/$slug" params={{ slug: speaker.slug }} className="group relative block">
      <Card
        className={`relative overflow-hidden bg-card border-border/50 card-hover
          ${featured ? "aspect-square" : "aspect-square"}
          hover:border-primary/50`}
      >
        {/* Headshot */}
        <div className="absolute inset-0">
          <img
            src={`/${speaker.headshot}`}
            alt={speaker.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60" />
        </div>

        {/* Content overlay */}
        <CardContent className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="space-y-2">
            {/* Specialty tag */}
            <span className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase bg-primary/20 text-primary border border-primary/30 rounded-full">
              {speaker.specialty}
            </span>

            {/* Name */}
            <h3 className="font-display text-2xl font-semibold text-white group-hover:text-secondary transition-colors">
              {speaker.name}
            </h3>

            {/* Title & Restaurant */}
            <p className="text-white/70 font-body text-lg">{speaker.title}</p>

            {/* Location */}
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {speaker.restaurant}, {speaker.location}
              </span>
            </div>
          </div>
        </CardContent>

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-linear-to-bl from-copper/20 to-transparent transform rotate-45 translate-x-14 -translate-y-14" />
        </div>
      </Card>
    </Link>
  );
}
