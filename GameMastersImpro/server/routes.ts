import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertGameSchema, insertRentalSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Games endpoints
  app.get("/api/games", async (req, res) => {
    const branchId = req.query.branch ? Number(req.query.branch) : undefined;
    const games = await storage.listGames(branchId);
    res.json(games);
  });

  app.post("/api/games", async (req, res) => {
    const parsed = insertGameSchema.parse(req.body);
    const game = await storage.createGame(parsed);
    res.status(201).json(game);
  });

  app.get("/api/games/qr/:code", async (req, res) => {
    const game = await storage.getGameByQR(req.params.code);
    if (!game) return res.sendStatus(404);
    res.json(game);
  });

  // Rentals endpoints
  app.get("/api/rentals/active", async (req, res) => {
    const branchId = req.query.branch ? Number(req.query.branch) : undefined;
    const rentals = await storage.listActiveRentals(branchId);
    res.json(rentals);
  });

  app.post("/api/rentals", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const parsed = insertRentalSchema.parse({
      ...req.body,
      employeeId: req.user.id,
    });

    const game = await storage.getGame(parsed.gameId);
    if (!game || game.status !== "available") {
      return res.status(400).send("Game is not available");
    }

    const rental = await storage.createRental(parsed);
    await storage.updateGameStatus(parsed.gameId, "rented");
    res.status(201).json(rental);
  });

  app.post("/api/rentals/:id/stop", async (req, res) => {
    const id = Number(req.params.id);
    const rental = await storage.getRental(id);
    if (!rental) return res.sendStatus(404);

    const endTime = new Date();
    const updated = await storage.updateRentalStatus(id, "completed", endTime);
    await storage.updateGameStatus(rental.gameId, "available");
    res.json(updated);
  });

  app.post("/api/rentals/:id/pause", async (req, res) => {
    const id = Number(req.params.id);
    const rental = await storage.getRental(id);
    if (!rental) return res.sendStatus(404);

    const updated = await storage.updateRentalStatus(id, "paused");
    res.json(updated);
  });

  // Branches endpoints
  app.get("/api/branches", async (_req, res) => {
    const branches = await storage.listBranches();
    res.json(branches);
  });

  // Analytics Endpoints
  app.get("/api/analytics/revenue", async (req, res) => {
    try {
      const revenueData = await db.query.games.findMany({
        columns: {
          name: true,
          revenue: true,
        },
      });

      res.json(revenueData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/analytics/revenue/daily", async (req, res) => {
    try {
      const employeeId = req.query.employeeId;
      const today = new Date();
      const rentalsRef = collection(db, 'rentals');
      const query = employeeId ? 
        where(rentalsRef, 'employeeId', '==', employeeId) : 
        rentalsRef;
        
      const snapshot = await getDocs(query);
      const dailyRevenue = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          const startTime = data.startTime.toDate();
          return startTime >= new Date(today.setHours(0, 0, 0, 0)) &&
                 startTime <= new Date(today.setHours(23, 59, 59, 999));
        })
        .map(doc => ({
          name: doc.data().startTime.toDate().toLocaleTimeString(),
          revenue: doc.data().totalCost || 0
        }));

      res.json(dailyRevenue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily revenue" });
    }
  });

  app.get("/api/analytics/revenue/weekly", async (req, res) => {
    try {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyRevenue = await db.query.rentals.findMany({
        where: (rentals, { and, gte, lte }) => and(
          gte(rentals.startTime, lastWeek),
          lte(rentals.startTime, today)
        ),
        columns: {
          startTime: true,
          revenue: true,
        },
      });

      res.json(weeklyRevenue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly revenue" });
    }
  });

  app.get("/api/analytics/revenue/monthly", async (req, res) => {
    try {
      const today = new Date();
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyRevenue = await db.query.rentals.findMany({
        where: (rentals, { and, gte, lte }) => and(
          gte(rentals.startTime, lastMonth),
          lte(rentals.startTime, today)
        ),
        columns: {
          startTime: true,
          revenue: true,
        },
      });

      res.json(monthlyRevenue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly revenue" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}