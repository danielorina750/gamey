import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { RentalTimer } from "@/components/rental-timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Game, Rental } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Clock, DollarSign } from "lucide-react";

export default function CustomerPortal() {
  const { qrCode } = useParams();
  const { toast } = useToast();

  const { data: game } = useQuery<Game>({
    queryKey: ["/api/games/qr", qrCode],
  });

  const { data: activeRentals = [] } = useQuery<Rental[]>({
    queryKey: ["/api/rentals/active"],
  });

  const rental = activeRentals.find((r) => r.gameId === game?.id);

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

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Invalid QR Code</h1>
              <p className="text-muted-foreground">
                This QR code is not associated with any game.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{game.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Rate: 3 KSH per minute</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>
                Status:{" "}
                <span className="capitalize font-medium">{game.status}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {rental && (
          <RentalTimer
            rentalId={rental.id}
            onPause={() => handlePause(rental.id)}
            onStop={() => {}} // Customers can't stop rentals
            isPaused={rental.status === "paused"}
          />
        )}

        {!rental && game.status === "available" && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                This game is available for rent. Please ask a staff member to start
                your rental.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
