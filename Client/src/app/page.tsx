'use client'

import { Competition, CompetitionsService } from '@/services/competitionService'
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Users, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Gallery } from '../components/gallery';
import { UnifiedSearch } from '@/components/search';

export default function Home() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [showSearch, setShowSearch] = useState(false);

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
    <div className="relative">
      {/* Hero Section */}
      <div className="relative h-[80vh] overflow-hidden">
        {/* Video Background */}
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-85">
          <source src="/background.webm?query=dark cinematic esports arena with dramatic lighting" type="video/webm" />
        </video>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-12 tracking-tight">
            <span className="block transform -skew-x-12">VINNOVA</span>
          </h1>

          {/* Statistics Cards */}
          <div className="flex flex-col md:flex-row gap-6 mb-12 max-w-4xl">
            <div className="bg-slate-600/30 backdrop-blur-sm rounded-2xl p-8 text-center min-w-[200px]">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">2000+</div>
              <div className="text-gray-300 text-lg">Competitors</div>
            </div>

            <div className="bg-slate-600/30 backdrop-blur-sm rounded-2xl p-8 text-center min-w-[280px]">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">700,000 LKR</div>
              <div className="text-gray-300 text-lg">Prize pool</div>
            </div>

            <div className="bg-slate-600/30 backdrop-blur-sm rounded-2xl p-8 text-center min-w-[200px]">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">25</div>
              <div className="text-gray-300 text-lg">Competitions</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-white text-xl md:text-2xl font-bold max-w-4xl mb-12 leading-tight text-balance">
            POWERING THE NEXT GENERATION OF COMPETITIONS
            <br />
            MANAGE, INNOVATE AND WIN TOGETHER
          </p>

          {/* Scroll Button */}
          <Button
            variant="secondary"
            size="lg"
            className="bg-black/30 hover:bg-black/30 text-white border-0 backdrop-blur-sm px-8 py-4 text-lg font-medium rounded-full "
          >
            SCROLL FOR MORE
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              <ChevronDown className="ml-2 h-5 w-5" />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Competitions Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-main mb-4">Competitions on Vinnova</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everyone's Battle Is Different. The Goal Is the Same: Victory. Glory. Prestige.
            </p>
          </div>

          {/* Competition Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Row 1 */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow shadow-main">
              <h3 className="text-lg font-medium text-gray-600">Software</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow shadow-main">
              <h3 className="text-lg font-medium text-gray-600">IoT</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow shadow-main">
              <h3 className="text-lg font-medium text-gray-600">Robotics</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow shadow-main">
              <h3 className="text-lg font-medium text-gray-600">Design</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>

            {/* Row 2 */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow shadow-main">
              <h3 className="text-lg font-medium text-gray-600">UI/UX</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow shadow-main">
              <h3 className="text-lg font-medium text-gray-600">Cybersecurity</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow shadow-main">
              <h3 className="text-lg font-medium text-gray-600">Machine Learning</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow shadow-main">
              <h3 className="text-lg font-medium text-gray-600">AI</h3>
              <p className="text-lg font-medium text-gray-600">Competitions</p>
            </div>
          </div>
          {/* See More Button */}
          <div className="flex items-center justify-center">
            <Link href="/competitions">
              <Button className="bg-main hover:bg-cyan-800 text-white px-8 py-6 rounded-2xl text-lg font-medium cursor-pointer">
                See More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Competitions Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-main mb-4">Latest Competitions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto text-balance">
              Everyone's Battle Is Different. The Goal Is the Same: Victory. Glory. Prestige.
            </p>
          </div>

          <Gallery competitions={competitions} />

          {/* See More Button */}
          <div className="text-center">
            <Link href={"/competitions"}>
              <Button className="bg-main hover:bg-cyan-800 text-white px-12 py-6 rounded-2xl text-lg font-medium cursor-pointer">
                View All Competitions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-main mb-4">Join Our Community</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with fellow competitors, organizers, and innovators. Discover teammates, share knowledge, and build lasting relationships.
            </p>
          </div>

          {/* Community Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-main rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Find Users</h3>
              <p className="text-gray-600 mb-6">
                Search and discover other competitors and organizers in our community. Find teammates and collaborators.
              </p>
              <Button variant="outline" className="border-main text-main hover:bg-main hover:text-white transition-colors" onClick={() => setShowSearch(true)}>
                Browse Users
              </Button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-main rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">View Profiles</h3>
              <p className="text-gray-600 mb-6">
                Explore detailed user profiles with their skills, projects, and achievements. Get inspired by their journey.
              </p>
              <Button variant="outline" className="border-main text-main hover:bg-main hover:text-white transition-colors" onClick={() => setShowSearch(true)}>
                Explore Profiles
              </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-main rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Build Your Profile</h3>
              <p className="text-gray-600 mb-6">
                Create an impressive profile showcasing your skills, projects, and achievements. Stand out in the community.
              </p>
              <Link href="/settings">
                <Button variant="outline" className="border-main text-main hover:bg-main hover:text-white transition-colors">
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {showSearch && (
        <div
          className="fixed inset-0 flex items-start justify-center pt-20 z-50 bg-black/30"
          onClick={() => setShowSearch(false)} // click outside to close
        >
          <div onClick={(e) => e.stopPropagation()} className="space-y-4"> {/* prevent overlay click from closing */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-2">Search</h2>
              <p className="text-white/80 text-sm">Find competitions or users</p>
            </div>
            <div className="space-y-3">
              <UnifiedSearch placeholder="Search competitions and users..." />
            </div>
          </div>
        </div>
      )}


    </div>
  )
}