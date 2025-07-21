
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
import { fetchAllUsers, updateUserRole, addCity as addCityAction, deleteCity as deleteCityAction, getCities } from "@/app/actions";
import { useToast } from "@/hooks/use-toast"


export default function AdminDashboardPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [newCity, setNewCity] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        if (user?.role !== 'admin') return;
        setIsLoading(true);
        try {
            const [userList, cityList] = await Promise.all([
                fetchAllUsers(),
                getCities()
            ]);
            setUsers(userList);
            const sortedCities = cityList.sort((a, b) => a.name.localeCompare(b.name));
            setCities(sortedCities);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error fetching data',
                description: 'Could not load administrative data. Please try again later.'
            });
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if (user?.role === 'admin') {
            refreshData();
        }
    }, [user]);


    const handleAddCity = async () => {
        if (!newCity.trim()) return;
        const result = await addCityAction(newCity);
        if (result.success && result.city) {
          await refreshData();
          setNewCity('');
          toast({ title: "City Added", description: `${newCity} has been added.` });
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const handleDeleteCity = async (cityId: string, cityName: string) => {
        const result = await deleteCityAction(cityId);
        if (result.success) {
            setCities(cities.filter(c => c.id !== cityId));
            toast({ title: "City Deleted", description: `${cityName} has been removed.` });
        } else {
             toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    }
    
    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
        const result = await updateUserRole(userId, newRole);
        if (result.success) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast({ title: "Role Updated", description: `User role has been changed to ${newRole}.` });
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };


    if (user?.role !== 'admin') {
        return (
            <div className="text-center p-8">
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
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">Loading users...</TableCell>
                                    </TableRow>
                                ) : users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                         <Select 
                                            value={u.role} 
                                            onValueChange={(value: 'user' | 'admin') => handleRoleChange(u.id, value)}
                                            disabled={u.id === user.id}
                                        >
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
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {isLoading ? (
                                     <TableRow>
                                        <TableCell colSpan={3} className="text-center">Loading cities...</TableCell>
                                    </TableRow>
                                ) : cities.map(city => (
                                    <TableRow key={city.id}>
                                        <TableCell>{city.name}</TableCell>
                                        <TableCell>{city.createdAt ? new Date(city.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteCity(city.id, city.name)}>Delete</Button>
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
