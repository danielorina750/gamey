import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RentalTimer } from "@/components/rental-timer";
import { GameScanner } from "@/components/game-scanner";
import { RevenueChart } from "@/components/revenue-chart";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Game, Rental } from "@shared/schema";
import { LogOut, Activity, DollarSign, PackageOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const { data: activeRentals = [] } = useQuery<Rental[]>({
    queryKey: ["/api/rentals/active", user?.branchId],
  });

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games", user?.branchId],
  });

  const startRental = async (gameId: number) => {
    try {
      await apiRequest("POST", "/api/rentals", { gameId });
      toast({
        title: "Rental Started",
        description: "Timer has been started for this game",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start rental",
        variant: "destructive",
      });
    }
  };

  const handlePause = async (rentalId: number) => {
    try {
      await apiRequest("POST", `/api/rentals/${rentalId}/pause`);
      toast({
        title: "Rental Paused",
        description: "Timer has been paused",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause rental",
        variant: "destructive",
      });
    }
  };

  const handleStop = async (rentalId: number) => {
    try {
      const res = await apiRequest("POST", `/api/rentals/${rentalId}/stop`);
      const rental = await res.json();
      toast({
        title: "Rental Completed",
        description: `Total cost: ${rental.totalCost} KSH`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop rental",
        variant: "destructive",
      });
    }
  };

  const availableGames = games.filter((game) => game.status === "available");
  const totalRevenue = activeRentals.reduce(
    (sum, rental) => sum + (rental.totalCost || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold">Game Rental Dashboard</h1>
          <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Active Rentals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeRentals.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRevenue} KSH</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PackageOpen className="mr-2 h-5 w-5" />
                Available Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{availableGames.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <GameScanner onGameScanned={startRental} />
            <RevenueChart
              title="Hourly Revenue"
              data={[
                { name: "9 AM", revenue: 150 },
                { name: "10 AM", revenue: 300 },
                { name: "11 AM", revenue: 200 },
                { name: "12 PM", revenue: 450 },
                { name: "1 PM", revenue: 280 },
                { name: "2 PM", revenue: 390 },
              ]}
            />
          </div>

          <div className="space-y-6">
            {activeRentals.map((rental) => (
              <RentalTimer
                key={rental.id}
                rentalId={rental.id}
                onPause={() => handlePause(rental.id)}
                onStop={() => handleStop(rental.id)}
                isPaused={rental.status === "paused"}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
