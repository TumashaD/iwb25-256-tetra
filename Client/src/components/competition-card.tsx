
import { Calendar,  Trophy, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Competition } from "@/services/competitionService"
import Link from "next/link"
import RegisterButton from "./register-button"

export function CompetitionCard({ competition }: { competition: Competition }) {

  const statusColors = {
    upcoming: "bg-blue-100 text-blue-800",
    active: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800",
  }

  const statusText = {
    upcoming: "Upcoming",
    active: "Active",
    completed: "Completed",
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
      <Link href={`/competition/${competition.id}`}>
        {/* Competition Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={competition.banner_url || "/placeholder.svg"}
            alt={competition.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4">
            <Badge className={`${statusColors[competition.status]} font-medium`}>{statusText[competition.status]}</Badge>
          </div>
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {competition.category}
            </Badge>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="mb-3">
            <h3 className="text-xl font-bold text-gray-900 mb-1 text-balance">{competition.title}</h3>
            <p className="text-teal-600 font-medium">{competition.name}</p>
          </div>

          {/* Stats */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">{competition.prize_pool} Prize Pool</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span className="text-sm">{competition.teams.toLocaleString()} Teams</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {competition.start_date} - {competition.end_date}
              </span>
            </div>
          </div>
        </div>
      </Link>
      <div className="px-6 pb-6">
        <RegisterButton className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200" text={competition.status === "active" ? "Register Now" : competition.status === "upcoming" ? "Register Now" : "View Results"} competitionId={competition.id}/>
        {/* <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
          <DialogTrigger asChild>
            <button
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200"
              onClick={handleRegistration}
            >
              {competition.status === "active" ? "Register Now" : competition.status === "upcoming" ? "Register Now" : "View Results"}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register for Competition</DialogTitle>
              <DialogDescription>
                Enter your team details to register for {competition.title}
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-id">Team ID</Label>
                <Input
                  id="team-id"
                  type="number"
                  value={enrollmentData.team_id}
                  onChange={(e) => setEnrollmentData({
                    ...enrollmentData,
                    team_id: parseInt(e.target.value)
                  })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Registration
              </Button>
            </form>
          </DialogContent>
        </Dialog> */}
      </div>
      
    </div>
  )
}
