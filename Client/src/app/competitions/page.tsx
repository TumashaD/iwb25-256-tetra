"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Filter, Calendar, DollarSign, Users, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompetitionCard } from "@/components/competition-card"
import { Competition, CompetitionsService } from "@/services/competitionService"
import { useRouter } from "next/navigation"

export default function CompetitionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [prizePoolFilter, setPrizePoolFilter] = useState("all")
  const [teamsFilter, setTeamsFilter] = useState("all")
  const [startDateFilter, setStartDateFilter] = useState("all")
  const [endDateFilter, setEndDateFilter] = useState("all")
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const router = useRouter();
    
    // generates current and upcoming months
  const generateDateOptions = () => {
    const currentDate = new Date();
    const options: Array<{value: string, label: string}> = [];
    
    // Add current and next 11 months (full year)
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      // Include year in the key: "aug-2025", "sep-2025", etc.
      const monthKey = `${date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()}-${date.getFullYear()}`;
      options.push({ value: monthKey, label: monthName });
    }
    
    return options;
  };

  const dateOptions = generateDateOptions();

  const fetchCompetitions = async () => {
    try {
      const competitions = await CompetitionsService.getCompetitions();
      console.log('Fetched competitions:', competitions);
      setCompetitions(competitions);
      
      // Extract unique categories from competitions
      const categories = [...new Set(competitions.map(comp => comp.category).filter(Boolean))];
      setAvailableCategories(categories.sort());
      
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleCompetitionClick = (competitionId: number) => {
    router.push(`/competition/${competitionId}`);
  };

  // Month and year-based date filtering
  const isDateInRange = (dateString: string, filterValue: string) => {
    if (filterValue === "all") return true;
    
    const competitionDate = new Date(dateString);
    const monthAbbr = competitionDate.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
    const year = competitionDate.getFullYear();
    const competitionKey = `${monthAbbr}-${year}`;
    
    return competitionKey === filterValue;
  };

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((competition) => {
      // Search filter
      const matchesSearch =
        competition.title.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const matchesCategory = categoryFilter === "all" || competition.category === categoryFilter

      // Status filter
      const matchesStatus = statusFilter === "all" || competition.status === statusFilter

      // Remove currency from the prize pool string
      const prizePool = parseFloat(competition.prize_pool ? competition.prize_pool.replace(/[^0-9.-]+/g, "") : "0");

      // Prize pool filter
      const matchesPrizePool =
        prizePoolFilter === "all" ||
        (prizePoolFilter === "under-100k" && prizePool < 100000) ||
        (prizePoolFilter === "100k-250k" && prizePool >= 100000 && prizePool < 250000) ||
        (prizePoolFilter === "250k-500k" && prizePool >= 250000 && prizePool < 500000) ||
        (prizePoolFilter === "500k-1m" && prizePool >= 500000 && prizePool < 1000000) ||
        (prizePoolFilter === "over-1m" && prizePool >= 1000000)

      // Teams filter
      const matchesTeams =
        teamsFilter === "all" ||
        (teamsFilter === "under-10" && competition.teams < 10) ||
        (teamsFilter === "10-20" && competition.teams >= 10 && competition.teams <= 20) ||
        (teamsFilter === "over-20" && competition.teams > 20)

      // Enhanced date filters using the new logic
      const matchesStartDate = isDateInRange(competition.start_date, startDateFilter);
      const matchesEndDate = isDateInRange(competition.end_date, endDateFilter);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesPrizePool &&
        matchesTeams &&
        matchesStartDate &&
        matchesEndDate
      )
    })
  }, [competitions,searchQuery, categoryFilter, statusFilter, prizePoolFilter, teamsFilter, startDateFilter, endDateFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setPrizePoolFilter("all")
    setTeamsFilter("all")
    setStartDateFilter("all")
    setEndDateFilter("all")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-teal-700 mb-4">All Competitions</h1>
          <p className="text-xl text-gray-600 max-w-3xl text-balance">
            Discover and join the world's most prestigious esports tournaments. Filter by your preferences to find the
            perfect competition.
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search competitions or games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-12">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder={loading ? "Loading categories..." : "Category"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                ) : (
                  availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={prizePoolFilter} onValueChange={setPrizePoolFilter}>
              <SelectTrigger className="h-12">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <SelectValue placeholder="Prize Pool" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prize Pools</SelectItem>
                <SelectItem value="under-100k">Under 100K</SelectItem>
                <SelectItem value="100k-250k">100K - 250K</SelectItem>
                <SelectItem value="250k-500k">250K - 500K</SelectItem>
                <SelectItem value="500k-1m">500K - 1M</SelectItem>
                <SelectItem value="over-1m">Over 1M</SelectItem>
              </SelectContent>
            </Select>

            <Select value={teamsFilter} onValueChange={setTeamsFilter}>
              <SelectTrigger className="h-12">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <SelectValue placeholder="Teams" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Counts</SelectItem>
                <SelectItem value="under-10">Under 10 Teams</SelectItem>
                <SelectItem value="10-20">10-20 Teams</SelectItem>
                <SelectItem value="over-20">Over 20 Teams</SelectItem>
              </SelectContent>
            </Select>

            <Select value={startDateFilter} onValueChange={setStartDateFilter}>
              <SelectTrigger className="h-12">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="Start Date" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Start Dates</SelectItem>
                {dateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={endDateFilter} onValueChange={setEndDateFilter}>
              <SelectTrigger className="h-12">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="End Date" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All End Dates</SelectItem>
                {dateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Summary and Clear */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Showing {filteredCompetitions.length} of {competitions.length} competitions
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-teal-700 border-teal-700 hover:bg-teal-50 bg-transparent"
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Competitions Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
            <span className="ml-4 text-teal-700 text-xl">Loading competitions...</span>
          </div>
        ) : filteredCompetitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompetitions.map((competition, index) => (
              <CompetitionCard key={index} competition={competition} userType="competitor" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Trophy className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h3 className="text-2xl font-bold text-gray-600 mb-2">No competitions found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
            <Button onClick={clearFilters} className="bg-teal-700 hover:bg-teal-800">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
