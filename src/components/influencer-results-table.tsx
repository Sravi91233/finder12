
"use client";

import { useState, useMemo } from "react";
import type { Influencer } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsUpDown, Download, AlertCircle, ArrowUp, ArrowDown, DatabaseZap, SearchCheck } from "lucide-react";
import { exportToCSV, formatNumber } from "@/lib/utils";
import Link from 'next/link';

type SortKey = keyof Influencer;

interface InfluencerResultsTableProps {
  influencers: Influencer[];
  isLoading: boolean;
  error: string | null;
  isLiveSearch: boolean;
}

const getProfileUrl = (connector: 'instagram' | 'youtube', username: string) => {
    return connector === 'instagram' ? `https://instagram.com/${username}` : `https://youtube.com/@${username}`;
}

export function InfluencerResultsTable({ influencers, isLoading, error, isLiveSearch }: InfluencerResultsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'followers_count', direction: 'descending' });

  const sortedInfluencers = useMemo(() => {
    let sortableItems = [...influencers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [influencers, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  }
  
  const renderEmptyState = () => {
    return (
        <div className="text-center py-16">
            <h3 className="text-xl font-semibold">No influencers found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search filters or select a different city.</p>
        </div>
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (influencers.length === 0) {
      return renderEmptyState();
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Influencer</TableHead>
            <TableHead className="cursor-pointer" onClick={() => requestSort('followers_count')}>
              <div className="flex items-center">Followers {getSortIcon('followers_count')}</div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => requestSort('engagement_rate')}>
               <div className="flex items-center">Engagement {getSortIcon('engagement_rate')}</div>
            </TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Bio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInfluencers.map((influencer) => (
            <TableRow key={influencer.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <Avatar data-ai-hint="person face">
                        <AvatarImage src={influencer.profile_pic_url} alt={influencer.full_name} />
                        <AvatarFallback>{influencer.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{influencer.full_name}</p>
                        <Link href={getProfileUrl(influencer.connector, influencer.username)} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                            @{influencer.username}
                        </Link>
                    </div>
                </div>
              </TableCell>
              <TableCell>{formatNumber(influencer.followers_count)}</TableCell>
              <TableCell>{influencer.engagement_rate.toFixed(2)}%</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-sm">
                    <Badge variant={influencer.connector === 'instagram' ? 'secondary' : 'destructive'} className="w-fit">{influencer.connector}</Badge>
                    <span className="text-muted-foreground">{influencer.category}</span>
                    <span className="text-muted-foreground">{influencer.location_city}, {influencer.location_country}</span>
                </div>
              </TableCell>
              <TableCell>
                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            View <ChevronsUpDown className="h-4 w-4" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <p className="text-sm text-muted-foreground max-w-xs py-2">{influencer.biography}</p>
                    </CollapsibleContent>
                </Collapsible>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  const getCardDescription = () => {
    if (isLoading) return "Searching...";
    if (error) return "An error occurred.";
    if (influencers.length > 0) {
      const resultText = isLiveSearch 
        ? `${influencers.length} influencers found and saved.` 
        : `Showing ${influencers.length} cached influencers.`;
      const icon = isLiveSearch
        ? <SearchCheck className="h-4 w-4 text-green-500" />
        : <DatabaseZap className="h-4 w-4 text-blue-500" />;
      return <div className="flex items-center gap-2">{icon} {resultText}</div>;
    }
    return 'Enter your criteria to find influencers.';
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  {getCardDescription()}
                </CardDescription>
            </div>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(influencers, "influencer_results.csv")} disabled={influencers.length === 0 || isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
