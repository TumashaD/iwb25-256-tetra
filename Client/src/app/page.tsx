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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Welcome to Vinnova
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover exciting competitions, showcase your skills, and connect with innovators worldwide
          </p>
        </div>

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {competitions.map((competition) => (
            <div
              key={competition.id}
              className="group relative overflow-hidden rounded-2xl bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {/* Banner Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-gray-700"
                style={{
                  backgroundImage: `url(${CompetitionsService.getBannerUrl(competition.id)})`,
                }}
                onError={(e) => {
                  // Fallback to gradient if banner fails to load
                  (e.target as HTMLElement).style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/60"></div>
              </div>
              
              {/* Content */}
              <div className="relative p-6 h-full flex flex-col justify-between min-h-[300px]">
                <div>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      competition.status === 'active' ? 'bg-green-500/80 text-white' :
                      competition.status === 'upcoming' ? 'bg-blue-500/80 text-white' :
                      competition.status === 'completed' ? 'bg-gray-500/80 text-white' :
                      'bg-red-500/80 text-white'
                    }`}>
                      {competition.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-300 bg-black/40 px-2 py-1 rounded">
                      {competition.category}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">
                    {competition.title}
                  </h2>
                  
                  <p className="text-gray-200 text-sm mb-4 line-clamp-3">
                    {competition.description}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {/* Dates */}
                  <div className="flex justify-between text-xs text-gray-300">
                    <div>
                      <span className="font-semibold">Start:</span>
                      <br />
                      {new Date(competition.start_date).toLocaleDateString()}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">End:</span>
                      <br />
                      {new Date(competition.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button className="w-full bg-blue-600/90 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 font-semibold">
                    {competition.status === 'active' ? 'Join Competition' :
                     competition.status === 'upcoming' ? 'Register Now' :
                     competition.status === 'completed' ? 'View Results' :
                     'View Details'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {competitions.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-300">No Competitions Yet</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Be the first to create exciting competitions for the community!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}