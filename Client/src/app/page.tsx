'use client'

import { Competition, CompetitionsService } from '@/services/competitionService'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

import { ChevronDown } from 'lucide-react';
import { CompetitionCard } from '@/components/competition-card';

export default function Home() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const router = useRouter();
  
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

  const handleCompetitionClick = (competitionId: number) => {
    router.push(`/competition/${competitionId}`);
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative h-[66vh] overflow-hidden">
        {/* Video Background */}
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-85">
          <source src="/background.webm?query=dark cinematic esports arena with dramatic lighting" type="video/webm" />
        </video>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          {/* Date Badge */}
          <div className="mb-8">
            <span className="inline-block px-6 py-2 bg-amber-700/80 text-white text-sm font-medium rounded-full backdrop-blur-sm">
              07 JULY - 24 AUGUST 2025
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-12 tracking-tight">
            <span className="block transform -skew-x-12">VINNOVA</span>
          </h1>

          {/* Statistics Cards */}
          <div className="flex flex-col md:flex-row gap-6 mb-12 max-w-4xl">
            <div className="bg-slate-600/30 backdrop-blur-sm rounded-2xl p-8 text-center min-w-[200px]">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">2000+</div>
              <div className="text-gray-300 text-lg">Players</div>
            </div>

            <div className="bg-slate-600/30 backdrop-blur-sm rounded-2xl p-8 text-center min-w-[280px]">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">$70,000,000</div>
              <div className="text-gray-300 text-lg">Prize pool</div>
            </div>

            <div className="bg-slate-600/30 backdrop-blur-sm rounded-2xl p-8 text-center min-w-[200px]">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">25</div>
              <div className="text-gray-300 text-lg">Competitions</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-white text-xl md:text-2xl font-bold max-w-4xl mb-12 leading-tight text-balance">
            NOTHING IS GRANTED. THE EWC IS A LIFE CHANGING 7 WEEK ESPORTS
            <br />
            EVENT THAT FEATURES THE WORLDS BEST COMPETITION
          </p>

          {/* Scroll Button */}
          <Button
            variant="secondary"
            size="lg"
            className="bg-black/70 hover:bg-black/80 text-white border-0 backdrop-blur-sm px-8 py-4 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105"
          >
            SCROLL FOR MORE
            <ChevronDown className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Competitions Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-teal-700 mb-4">Competitions on Vinnova</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everyone's Battle Is Different. The Goal Is the Same: Victory. Glory. Prestige.
            </p>
          </div>

          {/* Competition Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Row 1 */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-600">Software</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-600">IoT</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-600">Robotics</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-600">Design</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>

            {/* Row 2 */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-600">UI/UX</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-600">Cybersecurity</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-600">Machine Learning</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-600">AI</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>

          </div>
            {/* See More Button */}
            <div className="flex items-center justify-center">
              <Button className="bg-teal-700 hover:bg-teal-800 text-white px-8 py-6 rounded-2xl text-lg font-medium">
                See More
              </Button>
            </div>
        </div>
      </section>

      {/* Competitions Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-teal-700 mb-4">Latest Competitions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto text-balance">
              Everyone's Battle Is Different. The Goal Is the Same: Victory. Glory. Prestige.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {competitions.map((competition) => (
              <div
                key={competition.id}
                onClick={() => handleCompetitionClick(competition.id)}
              >
                <CompetitionCard competition={competition} />
              </div>
            ))}
          </div>

          {/* See More Button */}
          <div className="text-center">
            <Button className="bg-teal-700 hover:bg-teal-800 text-white px-12 py-6 rounded-2xl text-lg font-medium">
              View All Competitions
            </Button>
          </div>
        </div>
      </section>
    </div>

      //   {/* Competitions Grid */}
      //   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      //     {competitions.map((competition) => (
      //       <div
      //         key={competition.id}
      //         onClick={() => handleCompetitionClick(competition.id)}
      //         className="group relative overflow-hidden rounded-2xl bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
      //       >
      //         {/* Banner Background */}
      //         <div 
      //           className="absolute inset-0 bg-cover bg-center bg-gray-700"
      //           style={{
      //             backgroundImage: `url(${competition.banner_url + "?t=" + new Date(competition.updated_at).getTime()})`,
      //           }}
      //           onError={(e) => {
      //             // Fallback to gradient if banner fails to load
      //             (e.target as HTMLElement).style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      //           }}
      //         >
      //           {/* Overlay for better text readability */}
      //           <div className="absolute inset-0 bg-black/60"></div>
      //         </div>
              
      //         {/* Content */}
      //         <div className="relative p-6 h-full flex flex-col justify-between min-h-[300px]">
      //           <div>
      //             {/* Status Badge */}
      //             <div className="flex items-center justify-between mb-4">
      //               <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      //                 competition.status === 'active' ? 'bg-green-500/80 text-white' :
      //                 competition.status === 'upcoming' ? 'bg-blue-500/80 text-white' :
      //                 competition.status === 'completed' ? 'bg-gray-500/80 text-white' :
      //                 'bg-red-500/80 text-white'
      //               }`}>
      //                 {competition.status.toUpperCase()}
      //               </span>
      //               <span className="text-xs text-gray-300 bg-black/40 px-2 py-1 rounded">
      //                 {competition.category}
      //               </span>
      //             </div>
                  
      //             <h2 className="text-xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">
      //               {competition.title}
      //             </h2>
                  
      //             <p className="text-gray-200 text-sm mb-4 line-clamp-3">
      //               {competition.description}
      //             </p>
      //           </div>
                
      //           <div className="space-y-3">
      //             {/* Dates */}
      //             <div className="flex justify-between text-xs text-gray-300">
      //               <div>
      //                 <span className="font-semibold">Start:</span>
      //                 <br />
      //                 {new Date(competition.start_date).toLocaleDateString()}
      //               </div>
      //               <div className="text-right">
      //                 <span className="font-semibold">End:</span>
      //                 <br />
      //                 {new Date(competition.end_date).toLocaleDateString()}
      //               </div>
      //             </div>
                  
      //             {/* Action Button */}
      //             <button 
      //               onClick={(e) => {
      //                 e.stopPropagation();
      //                 handleCompetitionClick(competition.id);
      //               }}
      //               className="w-full bg-blue-600/90 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 font-semibold"
      //             >
      //               {competition.status === 'active' ? 'Join Competition' :
      //                competition.status === 'upcoming' ? 'Register Now' :
      //                competition.status === 'completed' ? 'View Results' :
      //                'View Details'}
      //             </button>
      //           </div>
      //         </div>
      //       </div>
      //     ))}
      //   </div>

      //   {/* Empty State */}
      //   {competitions.length === 0 && (
      //     <div className="text-center py-16">
      //       <div className="text-6xl mb-4">🏆</div>
      //       <h3 className="text-2xl font-semibold mb-4 text-gray-300">No Competitions Yet</h3>
      //       <p className="text-gray-400 max-w-md mx-auto">
      //         Be the first to create exciting competitions for the community!
      //       </p>
      //     </div>
      //   )}
      // </div>
  )
}