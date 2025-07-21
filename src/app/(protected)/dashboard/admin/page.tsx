
"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, City } from "@/types"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"


// Mock data for now
const mockUsers: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', createdAt: new Date(), lastLogin: new Date() },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user', createdAt: new Date(), lastLogin: new Date() },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'user', createdAt: new Date(), lastLogin: new Date() },
]

const mockCities: City[] = [
    { id: 1, name: 'New York' },
    { id: 2, name: 'Los Angeles' },
    { id: 3, name: 'London' },
]


export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [cities, setCities] = useState<City[]>(mockCities);
    const [newCity, setNewCity] = useState('');

    // In a real app, you would fetch this data
    // useEffect(() => {
    //     if (user?.role === 'admin') {
    //         fetchAllUsers().then(setUsers);
    //         getAllCities().then(setCities);
    //     }
    // }, [user]);


    const handleAddCity = async () => {
        if (!newCity.trim()) return;
        // const addedCity = await addCityAction(newCity);
        // if (addedCity) {
        //   setCities([...cities, addedCity]);
        //   setNewCity('');
        // }
        alert(`Would add city: ${newCity}`);
    };
    
    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
        // await updateUserRoleAction(userId, newRole);
        // setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
         alert(`Would change user ${userId} to ${newRole}`);
    };


    if (user?.role !== 'admin') {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        )
    }

    return (
        <Tabs defaultValue="users">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="cities">Content Management</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Users</CardTitle>
                        <CardDescription>View and manage all registered users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                         <Select value={u.role} onValueChange={(value: 'user' | 'admin') => handleRoleChange(u.id, value)}>
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="cities">
                 <Card>
                    <CardHeader>
                        <CardTitle>Manage Cities</CardTitle>
                        <CardDescription>Add or remove cities available for influencer searches.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Input 
                                placeholder="Enter new city name"
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                            />
                            <Button onClick={handleAddCity}>Add City</Button>
                        </div>
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>City Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {cities.map(city => (
                                    <TableRow key={city.id}>
                                        <TableCell>{city.name}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="destructive" size="sm" onClick={() => alert(`Would delete ${city.name}`)}>Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
