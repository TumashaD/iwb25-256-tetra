import { Calendar,  Settings2Icon,  Trophy, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Competition } from "@/services/competitionService"
import Link from "next/link"
import RegisterButton from "./register-button"
import { Button } from "./ui/button"

export function CompetitionCard({ competition, userType }: { competition: Competition, userType:"organizer"|"competitor" }) {

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

  const href = userType == "competitor" ? `/competitions/${competition.id}` : `/dashboard/organizer/competition/${competition.id}`;

  return (
    <div className="w-full max-w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group h-[470px] flex flex-col">
      <Link href={href} className="flex flex-col flex-1 min-w-0">
        {/* Competition Image */}
        <div className="relative h-48 overflow-hidden flex-shrink-0 w-full">
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
        <div className="p-6 flex-1 flex flex-col min-w-0">
          <div className="mb-3 flex-shrink-0 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1 text-balance line-clamp-2 break-words">{competition.title}</h3>
          </div>

          {/* Stats */}
          <div className="space-y-3 mb-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <Trophy className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{competition.prize_pool} Prize Pool</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate">{competition.teams.toLocaleString()} Teams</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate">
                {competition.start_date} - {competition.end_date}
              </span>
            </div>
          </div>

          {/* Organizer Button */}
          {userType == "organizer" && 
            <div className="flex-shrink-0 w-full">
              <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 cursor-pointer">
                <Settings2Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Manage</span>
              </Button>
            </div>
          }
        </div> 
      </Link>
      
      {/* Competitor Button - Outside Link */}
      {userType == "competitor" && 
        <div className="px-6 pb-6 flex-shrink-0 w-full">
          <RegisterButton text={competition.status === "active" ? "Register Now" : competition.status === "upcoming" ? "Register Now" : "View Results"} competitionId={competition.id}/>
        </div>
      }
    </div>
  )
}