'use client'

import { Navbar } from '@/components/ui/navbar'
import { Competition, CompetitionsService } from '@/services/competitionService'
import { useEffect, useState } from 'react';

export default function Home() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  
  const fetchCompetitions = async () => {
    try {
      const competitions = await CompetitionsService.getCompetitions();
      console.log('Fetched competitions:', competitions);
      setCompetitions(competitions);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cyan-800 text-white">
      <Navbar />
      <div>
        {/* Render the fetched competitions here */}
        <h1 className="text-2xl font-bold mb-4">Welcome to the Competitions Page</h1>
        <ul className="space-y-4">
          {competitions.map((competition) => (
            <li key={competition.id} className="bg-white text-black p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold">{competition.title}</h2>
              <p>{competition.description}</p>
              <p className="text-sm text-gray-600">Category: {competition.category}</p>
              <p className="text-sm text-gray-600">Organizer ID: {competition.organizer_id}</p>
              <p className="text-sm text-gray-600">Start Date: {new Date(competition.start_date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">End Date: {new Date(competition.end_date).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}