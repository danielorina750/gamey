import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GameScannerProps {
  onGameScanned: (gameId: number) => void;
}

export function GameScanner({ onGameScanned }: GameScannerProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const initializeScanner = async () => {
      try {
        scanner = new Html5QrcodeScanner(
          "game-scanner",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        await scanner.render(async (decodedText) => {
          try {
            const res = await apiRequest("GET", `/api/games/qr/${decodedText}`);
            const game = await res.json();
            onGameScanned(game.id);
            if (scanner) {
              scanner.pause(true);
            }
          } catch (error) {
            toast({
              title: "Invalid QR Code",
              description: "This QR code is not associated with any game",
              variant: "destructive",
            });
          }
        }, (error) => {
          console.error("QR Scan error:", error);
        });

        setIsScanning(true);
      } catch (error) {
        console.error("Scanner initialization error:", error);
        toast({
          title: "Scanner Error",
          description: "Failed to initialize the QR scanner",
          variant: "destructive",
        });
      }
    };

    initializeScanner();

    return () => {
      if (scanner && isScanning) {
        try {
          scanner.clear();
        } catch (error) {
          console.error("Scanner cleanup error:", error);
        }
      }
    };
  }, [onGameScanned, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Game QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div id="game-scanner" className="w-full max-w-sm mx-auto" />
      </CardContent>
    </Card>
  );
}