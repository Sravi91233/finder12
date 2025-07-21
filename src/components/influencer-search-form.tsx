
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getSuggestions } from "@/app/actions";
import { cn, formatNumber } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Sparkles, Search, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import type { SearchParams, City } from "@/types";
import type { SuggestSearchTermsOutput } from "@/ai/flows/suggest-search-terms";

const formSchema = z.object({
  city: z.string().min(1, { message: "City is required to start a search." }),
  country: z.string().optional(),
  category: z.string().optional(),
  connector: z.enum(["all", "instagram", "youtube"]).default("all"),
  followers: z.array(z.number()).default([0, 10000000]),
  engagement: z.array(z.number()).default([0, 100]),
  posts: z.array(z.number()).default([0, 5000]),
  bio_keyword: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const categories = ["Fashion", "Beauty", "Gaming", "Tech", "Food", "Travel", "Fitness", "Lifestyle", "Books & Writing", "Health & Fitness", "Family & Relationships", "Art & Design"];

interface InfluencerSearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  cities: City[];
}

export function InfluencerSearchForm({ onSearch, isLoading, cities }: InfluencerSearchFormProps) {
  const [suggestions, setSuggestions] = useState<SuggestSearchTermsOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: "",
      country: "",
      category: "all",
      connector: "all",
      followers: [0, 10000000],
      engagement: [0, 100],
      posts: [0, 5000],
      bio_keyword: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const searchParams: SearchParams = {
      ...values,
      category: values.category === "all" ? undefined : values.category,
      followers_min: values.followers[0],
      followers_max: values.followers[1],
      engagement_rate_min: values.engagement[0],
      engagement_rate_max: values.engagement[1],
      posts_min: values.posts[0],
      posts_max: values.posts[1],
    };
    onSearch(searchParams);
  };

  const handleGetSuggestions = async () => {
    const keyword = form.getValues("bio_keyword");
    if (!keyword) return;
    setIsSuggesting(true);
    setSuggestions(null);
    const result = await getSuggestions(keyword);
    setSuggestions(result);
    setIsSuggesting(false);
  };

  const applySuggestion = (type: 'keyword' | 'category', value: string) => {
    if (type === 'keyword') {
      form.setValue('bio_keyword', value, { shouldValidate: true });
    } else {
      form.setValue('category', value, { shouldValidate: true });
    }
    setSuggestions(null);
  }

  const cityOptions = cities.map(c => ({ value: c.name, label: c.name })).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Card>
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g. USA" {...field} /></FormControl></FormItem>
            )}/>

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>City (Required)</FormLabel>
                   <Combobox
                      options={cityOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select or type a city..."
                      searchPlaceholder="Search for a city..."
                      noResultsText="No cities found."
                    />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="relative">
              <FormField
                control={form.control}
                name="bio_keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio/Handle Keyword</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. fashion blogger" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: Use AI to get suggestions.
                    </FormDescription>
                  </FormItem>
                )}
              />
              <Button type="button" size="icon" variant="ghost" className="absolute top-6 right-0" onClick={handleGetSuggestions} disabled={isSuggesting}>
                {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
              </Button>
            </div>
            {suggestions && (
              <div className="space-y-2 rounded-md border p-2">
                 <p className="text-sm font-medium">Suggestions:</p>
                 <div className="flex flex-wrap gap-2">
                    {suggestions.suggestedKeywords?.map(k => <Badge key={k} variant="secondary" className="cursor-pointer" onClick={() => applySuggestion('keyword', k)}>{k}</Badge>)}
                    {suggestions.suggestedCategories?.map(c => <Badge key={c} variant="outline" className="cursor-pointer" onClick={() => applySuggestion('category', c)}>{c}</Badge>)}
                 </div>
              </div>
            )}
            
            <FormField control={form.control} name="connector" render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a platform" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>

            <FormField control={form.control} name="followers" render={({ field }) => (
              <FormItem>
                <FormLabel>Followers</FormLabel>
                <FormControl>
                  <Slider min={0} max={10000000} step={10000} value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{formatNumber(field.value[0])}</span>
                  <span>{formatNumber(field.value[1])}</span>
                </div>
              </FormItem>
            )}/>
            
            <FormField control={form.control} name="engagement" render={({ field }) => (
              <FormItem>
                <FormLabel>Engagement Rate (%)</FormLabel>
                <FormControl>
                  <Slider min={0} max={100} step={1} value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{field.value[0]}%</span>
                  <span>{field.value[1]}%</span>
                </div>
              </FormItem>
            )}/>

            <FormField control={form.control} name="posts" render={({ field }) => (
              <FormItem>
                <FormLabel>Post Count</FormLabel>
                <FormControl>
                  <Slider min={0} max={5000} step={10} value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{field.value[0]}</span>
                  <span>{field.value[1]}</span>
                </div>
              </FormItem>
            )}/>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
