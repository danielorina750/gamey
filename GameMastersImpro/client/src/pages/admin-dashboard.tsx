import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodePrinter } from "@/components/qr-code-printer";
import { RevenueChart } from "@/components/revenue-chart";
import { Button } from "@/components/ui/button";
import { LogOut, Users, PackageOpen, ActivitySquare, DollarSign } from "lucide-react";
import { Game, User } from "@shared/schema";
import { createEmployee, addGame } from "@/lib/firebase/admin-utils";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [newEmployee, setNewEmployee] = useState({ email: '', password: '', location: '' });
  const [newGame, setNewGame] = useState({ name: '', branchId: '' });
  const { toast } = useToast();

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/users/employees"],
  });

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: revenueData = [] } = useQuery<{ name: string; revenue: number }[]>({
    queryKey: ["/api/analytics/revenue"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/revenue");
      const data = await response.json();
      return data;
    }
  });

  const { data: dailyRevenue = [] } = useQuery<{ name: string; revenue: number }[]>({
    queryKey: ["/api/analytics/revenue/daily"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/revenue/daily");
      const data = await response.json();
      return data;
    }
  });

  const { data: weeklyRevenue = [] } = useQuery<{ name: string; revenue: number }[]>({
    queryKey: ["/api/analytics/revenue/weekly"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/revenue/weekly");
      const data = await response.json();
      return data;
    }
  });

  const { data: monthlyRevenue = [] } = useQuery<{ name: string; revenue: number }[]>({
    queryKey: ["/api/analytics/revenue/monthly"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/revenue/monthly");
      const data = await response.json();
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.displayName || user?.email}</span>
            <Button variant="ghost" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Active Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PackageOpen className="mr-2 h-5 w-5" />
                Total Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{games.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ActivitySquare className="mr-2 h-5 w-5" />
                Active Rentals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {games.filter(g => g.status === "rented").length}
              </div>
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
              <div className="text-3xl font-bold">
                {games.reduce((sum, game) => sum + Number(game.revenue), 0)} KSH
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart title="Revenue by Branch" data={revenueData} />
          <RevenueChart title="Top Performing Games" data={revenueData} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{employee.displayName || employee.email}</p>
                      <p className="text-sm text-muted-foreground">{employee.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Last Active</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.lastActive ? new Date(employee.lastActive).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Game Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {games.slice(0, 5).map(game => (
                  <div key={game.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{game.name}</p>
                      <p className="text-sm text-muted-foreground">Total Rentals: {game.totalRentals}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{game.revenue} KSH</p>
                      <p className="text-sm text-muted-foreground capitalize">{game.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await createEmployee(newEmployee.email, newEmployee.password, user?.branchId || '', newEmployee.location);
                  toast({ title: "Success", description: "Employee created successfully" });
                  setNewEmployee({ email: '', password: '', location: '' });
                } catch (error) {
                  toast({ title: "Error", description: "Failed to create employee", variant: "destructive" });
                }
              }}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newEmployee.location}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit">Add Employee</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add New Game</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await addGame(newGame.name, user?.branchId || '');
                  toast({ title: "Success", description: "Game added successfully" });
                  setNewGame({ name: '', branchId: '' });
                } catch (error) {
                  toast({ title: "Error", description: "Failed to add game", variant: "destructive" });
                }
              }}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newGame.name}
                    onChange={(e) => setNewGame(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit">Add Game</Button>
              </form>
            </CardContent>
          </Card>
        <Card className="mt-8">
            <CardHeader>
              <CardTitle>QR Code Management</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodePrinter />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}