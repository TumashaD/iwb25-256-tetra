'use client'

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from '@radix-ui/react-label';
import { Input } from './ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Team, TeamService } from '@/services/teamService';
import { Loader2 } from 'lucide-react';
import { CreateEnrollmentData, EnrollmentService } from '@/services/enrollmentService';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';

const RegisterButton = ({ className, text, competitionId }: { className: string, text: string, competitionId: number }) => {
    const [showRegistration, setShowRegistration] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();
    const [userTeams, setUserTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    const fetchUserTeams = async () => {
        try {
            if (user?.id) {
                const teams = await TeamService.getUserTeams(user.id);
                setUserTeams(teams);
            }
        } catch (error) {
            console.error('Error fetching user teams:', error);
        }
    };

    const handleRegistration = () => {
        if (!user && !loading) {
            router.push('/signup');
        } else {
            fetchUserTeams();
            setShowRegistration(true);
        }
    };

    // const handleFormSubmit = () => async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (selectedTeam && user) {
    //         try {
    //             const newEnrollment: CreateEnrollmentData = {
    //                 team_id: selectedTeam.id,
    //                 competition_id: competitionId,
    //                 status: 'pending'
    //             };
    //             const response = await EnrollmentService.createEnrollment(user.id, newEnrollment);
    //             console.log('Enrollment successful:', response);
    //         }
    //         catch (error) {
    //             console.error('Error creating enrollment:', error);
    //             alert(error instanceof Error ? error.message : 'An unexpected error occurred');
    //         }
    //     }
    // };

    const handleFormSubmit = () => {
        if (selectedTeam && user) {
            (async () => {
                try {
                    const newEnrollment: CreateEnrollmentData = {
                        team_id: selectedTeam.id,
                        competition_id: competitionId,
                        status: 'Registered'
                    };
                    await EnrollmentService.createEnrollment(user.id, newEnrollment);
                    setShowRegistration(false);
                    alert('Enrollment successful!');
                }
                catch (error) {
                    console.error('Error creating enrollment:', error);
                    alert(error instanceof Error ? error.message : 'An unexpected error occurred');
                }
            })();
        }
    }

    return (
        <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
            <DialogTrigger asChild>
                <Button
                    className={`w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 ${className}`}
                    onClick={handleRegistration}
                >
                    {text}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Register for Competition</DialogTitle>
                    <DialogDescription>
                        Choose your team to register for this competition.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="memberEmail">Teams</Label>
                        {/* Choose your team */}
                        <Select
                            value={selectedTeam?.id?.toString() || ""}
                            onValueChange={(value) => {
                                const team = userTeams.find((team) => team.id.toString() === value);
                                setSelectedTeam(team || null);
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                            <SelectContent>
                                {userTeams.map((team) => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="submit"
                            disabled={loading || !selectedTeam}
                            className="flex-1"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Register
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowRegistration(false)}
                            className="flex-1 bg-transparent"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterButton;