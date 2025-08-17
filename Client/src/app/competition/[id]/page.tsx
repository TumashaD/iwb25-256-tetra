'use client'

import { Competition } from "@/services/competitionService";
import { OrganizerService } from "@/services/organizerService";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import grapejs from "grapesjs";

export default function CompetitionPage() {
  const [competition, setCompetition] = useState<string | null>(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchCompetition = async () => {
      const competitionData = await OrganizerService.getCompetition(Number(id));
      const fullHTML = `
        <style>${competitionData.landing_css}</style>
        ${competitionData.landing_html}
      `;
      setCompetition(fullHTML);
    };

    fetchCompetition();
  }, [id]);

  if (typeof window === 'undefined' || !competition) {
    return <h1>Loading...</h1>;
  }

  return (
    <iframe
      srcDoc={competition}
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Competition Landing Page"
    />
  );
}