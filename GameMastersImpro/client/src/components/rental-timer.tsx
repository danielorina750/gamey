import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, PauseCircle, StopCircle } from "lucide-react";

interface RentalTimerProps {
  rentalId: number;
  onPause: () => void;
  onStop: () => void;
  isPaused?: boolean;
}

export function RentalTimer({ rentalId, onPause, onStop, isPaused = false }: RentalTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [cost, setCost] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!isPaused) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
        setCost(c => c + (3 / 60)); // 3 KSH per minute
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Timer #{rentalId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-bold">{formatTime(seconds)}</div>
          <div className="text-2xl text-muted-foreground">
            Cost: {cost.toFixed(2)} KSH
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPause}
              disabled={isPaused}
            >
              {isPaused ? <PlayCircle className="h-6 w-6" /> : <PauseCircle className="h-6 w-6" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={onStop}
            >
              <StopCircle className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
