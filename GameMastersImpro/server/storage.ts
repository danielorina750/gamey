import { Game, Rental, Branch, User, InsertUser, InsertGame, InsertRental } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game operations
  getGame(id: number): Promise<Game | undefined>;
  getGameByQR(qrCode: string): Promise<Game | undefined>;
  listGames(branchId?: number): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGameStatus(id: number, status: Game["status"]): Promise<Game>;
  
  // Branch operations
  getBranch(id: number): Promise<Branch | undefined>;
  listBranches(): Promise<Branch[]>;
  
  // Rental operations
  getRental(id: number): Promise<Rental | undefined>;
  createRental(rental: InsertRental): Promise<Rental>;
  updateRentalStatus(id: number, status: Rental["status"], endTime?: Date): Promise<Rental>;
  listActiveRentals(branchId?: number): Promise<Rental[]>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private branches: Map<number, Branch>;
  private rentals: Map<number, Rental>;
  private currentId: { [key: string]: number };
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.branches = new Map();
    this.rentals = new Map();
    this.currentId = { users: 1, games: 1, branches: 1, rentals: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    
    // Initialize with a default branch and admin user
    const branch: Branch = {
      id: this.currentId.branches++,
      name: "Main Branch",
      location: "City Center"
    };
    this.branches.set(branch.id, branch);
    
    const admin: User = {
      id: this.currentId.users++,
      username: "admin",
      password: "admin", // This should be hashed in production
      role: "admin",
      branchId: branch.id
    };
    this.users.set(admin.id, admin);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameByQR(qrCode: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(
      (game) => game.qrCode === qrCode
    );
  }

  async listGames(branchId?: number): Promise<Game[]> {
    const games = Array.from(this.games.values());
    return branchId ? games.filter(g => g.branchId === branchId) : games;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = this.currentId.games++;
    const qrCode = `GAME-${id}-${game.branchId}`;
    const newGame: Game = { ...game, id, qrCode, status: "available" };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGameStatus(id: number, status: Game["status"]): Promise<Game> {
    const game = await this.getGame(id);
    if (!game) throw new Error("Game not found");
    const updatedGame = { ...game, status };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getBranch(id: number): Promise<Branch | undefined> {
    return this.branches.get(id);
  }

  async listBranches(): Promise<Branch[]> {
    return Array.from(this.branches.values());
  }

  async getRental(id: number): Promise<Rental | undefined> {
    return this.rentals.get(id);
  }

  async createRental(rental: InsertRental): Promise<Rental> {
    const id = this.currentId.rentals++;
    const newRental: Rental = {
      ...rental,
      id,
      startTime: new Date(),
      status: "active",
      totalCost: null,
    };
    this.rentals.set(id, newRental);
    return newRental;
  }

  async updateRentalStatus(
    id: number,
    status: Rental["status"],
    endTime?: Date
  ): Promise<Rental> {
    const rental = await this.getRental(id);
    if (!rental) throw new Error("Rental not found");
    
    const updatedRental: Rental = {
      ...rental,
      status,
      endTime: endTime || rental.endTime,
    };
    
    if (status === "completed" && endTime) {
      const duration = endTime.getTime() - rental.startTime.getTime();
      const minutes = Math.ceil(duration / (1000 * 60));
      updatedRental.totalCost = minutes * 3; // 3 KSH per minute
    }
    
    this.rentals.set(id, updatedRental);
    return updatedRental;
  }

  async listActiveRentals(branchId?: number): Promise<Rental[]> {
    const rentals = Array.from(this.rentals.values())
      .filter(r => r.status === "active" || r.status === "paused");
    
    if (!branchId) return rentals;
    
    const branchGames = await this.listGames(branchId);
    const branchGameIds = new Set(branchGames.map(g => g.id));
    return rentals.filter(r => branchGameIds.has(r.gameId));
  }
}

export const storage = new MemStorage();
