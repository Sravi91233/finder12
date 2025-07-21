
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, PlusCircle, History } from "lucide-react";
import Link from "next/link";

const mockSearchHistory = [
    { id: 1, term: "New York, Fashion" },
    { id: 2, term: "Los Angeles, Gaming" },
    { id: 3, term: "London, Tech" },
];

const mockSavedLists = [
    { id: 1, name: "Summer 2024 Campaign", count: 12 },
    { id: 2, name: "Tech Launch Partners", count: 5 },
];


export default function UserDashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here's an overview of your activity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                <CardTitle>Recent Searches</CardTitle>
                            </div>
                             <Button variant="ghost" size="sm" asChild>
                                <Link href="/influencer-finder">View All</Link>
                            </Button>
                        </div>
                        <CardDescription>Your most recent influencer searches.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {mockSearchHistory.map(search => (
                                <li key={search.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted">
                                    <span>{search.term}</span>
                                    <Button variant="outline" size="sm">Re-run</Button>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <List className="h-5 w-5" />
                                <CardTitle>Saved Influencer Lists</CardTitle>
                            </div>
                            <Button variant="outline" size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New
                            </Button>
                        </div>
                        <CardDescription>Your curated lists for different campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {mockSavedLists.map(list => (
                                <li key={list.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted">
                                    <span>{list.name}</span>
                                    <span className="text-muted-foreground">{list.count} influencers</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
             <div className="text-center">
                 <Button size="lg" asChild>
                    <Link href="/influencer-finder">Start a New Search</Link>
                 </Button>
            </div>
        </div>
    )
}
