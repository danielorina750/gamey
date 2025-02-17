import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RentalTimer } from "@/components/rental-timer";
import { GameScanner } from "@/components/game-scanner";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Game, Rental } from "@shared/schema";
import { LogOut, History, Timer, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: activeRentals = [] } = useQuery<Rental[]>({
    queryKey: ["/api/rentals/active"],
  });

  const { data: rentalHistory = [] } = useQuery<Rental[]>({
    queryKey: ["/api/rentals/history"],
  });

  const handlePause = async (rentalId: number) => {
    try {
      await apiRequest("POST", `/api/rentals/${rentalId}/pause`);
      toast({
        title: "Game Paused",
        description: "Your rental has been paused. It will auto-resume in 20 minutes.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause game",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold">Customer Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.displayName || user?.email}</span>
            <Button variant="ghost" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
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
                <Timer className="mr-2 h-5 w-5" />
                Total Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {activeRentals.reduce((sum, rental) => {
                  const duration = new Date().getTime() - new Date(rental.startTime).getTime();
                  return sum + Math.floor(duration / (1000 * 60));
                }, 0)} mins
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                Completed Rentals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rentalHistory.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <GameScanner onGameScanned={(gameId) => {
              window.location.href = `/customer/${gameId}`;
            }} />
            <Card>
              <CardHeader>
                <CardTitle>Active Rentals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeRentals.map((rental) => (
                  <RentalTimer
                    key={rental.id}
                    rentalId={rental.id}
                    onPause={() => handlePause(rental.id)}
                    onStop={() => {}} // Customers can't stop rentals
                    isPaused={rental.status === "paused"}
                  />
                ))}
                {activeRentals.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    You have no active rentals
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rentalHistory.map((rental) => (
                    <div key={rental.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Game #{rental.gameId}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(rental.startTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{rental.totalCost} KSH</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {rental.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {rentalHistory.length === 0 && (
                    <p className="text-center text-muted-foreground">
                      No rental history available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
