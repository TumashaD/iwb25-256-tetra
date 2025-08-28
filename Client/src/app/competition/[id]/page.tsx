'use client'

import { OrganizerService } from "@/services/organizerService";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CompetitionPage() {
  const [competition, setCompetition] = useState<string | null>(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchCompetition = async () => {
      const competitionData = await OrganizerService.getCompetition(Number(id));
      let fullHTML = '';
      if (!competitionData.landing_html || !competitionData.landing_css) {
        fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Competition Landing Page</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 0;
      color: #222;
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .banner {
      width: 100%;
      height: 280px;
      object-fit: cover;
      background: #e2e8f0;
      display: block;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: #2563eb;
    }
    .description {
      font-size: 1.2rem;
      margin-bottom: 24px;
      color: #374151;
    }
    .details {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 24px;
    }
    .detail {
      flex: 1 1 200px;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 16px;
      font-size: 1rem;
      color: #334155;
    }
    .cta {
      display: block;
      width: 100%;
      text-align: center;
      margin-top: 32px;
    }
    .cta-btn {
      background: #2563eb;
      color: #fff;
      padding: 16px 32px;
      border: none;
      border-radius: 8px;
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
    }
    .cta-btn:hover {
      background: #1e40af;
    }
  </style>
</head>
<body>
  <div class="container">
    <img class="banner" src="${competitionData.banner_url}" alt="Competition Banner" onerror="this.style.display='none'">
    <div class="content">
      <div class="title">${competitionData.title}</div>
      <div class="description">${competitionData.description}</div>
      <div class="details">
        <div class="detail"><strong>Category:</strong> ${competitionData.category}</div>
        <div class="detail"><strong>Status:</strong> ${competitionData.status}</div>
        <div class="detail"><strong>Start Date:</strong> ${competitionData.start_date}</div>
        <div class="detail"><strong>End Date:</strong> ${competitionData.end_date}</div>
      </div>
      <div class="cta">
        <a href="/register" class="cta-btn">Register Now</a>
      </div>
    </div>
  </div>
</body>
</html>`
      } else {
        fullHTML = `
          <style>${competitionData.landing_css}</style>
          ${competitionData.landing_html}
        `;
      }
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