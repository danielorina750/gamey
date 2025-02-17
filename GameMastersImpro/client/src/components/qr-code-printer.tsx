
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Game } from "@shared/schema";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { gamesCollection } from "@/lib/firebase/collections";

export function QRCodePrinter() {
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["games"],
    queryFn: async () => {
      const snapshot = await getDocs(gamesCollection);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
    }
  });

  const printQRCodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Game QR Codes</title>
          <style>
            .qr-container { 
              display: inline-block;
              margin: 10px;
              padding: 10px;
              border: 1px solid #ccc;
              text-align: center;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
          <script src="https://unpkg.com/qrcode.react@3.1.0/lib/umd/qrcode-react.min.js"></script>
        </head>
        <body>
          <button onclick="window.print()" class="no-print" style="margin: 20px;">Print QR Codes</button>
          <div id="qr-containers"></div>
          <script>
            const games = ${JSON.stringify(games)};
            const container = document.getElementById('qr-containers');
            games.forEach(game => {
              const div = document.createElement('div');
              div.className = 'qr-container';
              div.innerHTML = \`
                <div>\${game.name}</div>
                <div id="qr-\${game.id}"></div>
                <div>\${game.qrCode}</div>
              \`;
              container.appendChild(div);
              
              const qrCode = new QRCodeSVG({
                value: game.qrCode,
                size: 128,
                level: "H"
              });
              document.getElementById(\`qr-\${game.id}\`).appendChild(qrCode);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game QR Codes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {games.map(game => (
            <div key={game.id} className="text-center">
              <QRCodeSVG
                id={`qr-${game.id}`}
                value={game.qrCode}
                size={128}
                level="H"
              />
              <div className="mt-2">{game.name}</div>
            </div>
          ))}
        </div>
        <Button onClick={printQRCodes}>Print QR Codes</Button>
      </CardContent>
    </Card>
  );
}
