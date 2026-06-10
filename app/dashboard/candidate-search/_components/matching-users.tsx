import {  filteredResultsAtom, matchLoadingAtom, searchQueryAtom, selectedJdAtom, selectedJobDescriptionAtom, sidebarAtom, sortByAtom, sortOrderAtom } from '@/store/candidatesearch-atom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React from 'react'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    UserRound, Search,
    Star, Filter, ChevronDown, 
    ChevronsRight,
    ChevronsLeft
} from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import { useSidebar } from '@/components/ui/sidebar';

import MatchingUsersMobile from './mobile-view';
import MatchingUsersDesktop from './desktop-view';
const MatchingUsersCard = () => {


    const [showSidebar, setShowSidebar] = useAtom(sidebarAtom);
    const filteredResults = useAtomValue(filteredResultsAtom);
    const selectedJd = useAtomValue(selectedJdAtom);
    const selectedJob = useAtomValue(selectedJobDescriptionAtom);
    const matchLoading = useAtomValue(matchLoadingAtom);
    const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
    const setSortBy = useSetAtom(sortByAtom);
    const setSortOrder= useSetAtom(sortOrderAtom);
    const { isMobile } = useSidebar()






    return (
        <Card className="mb-6 relative">
            <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="absolute top-2 -left-4"
            >
                {showSidebar ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
            </Button>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">

                        <UserRound className="mr-2 h-5 w-5 text-indigo-500" />
                        Matching Candidates
                    </CardTitle>

                    {filteredResults.length > 0 && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-800">
                            {filteredResults.length} candidates
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    {selectedJd
                        ? `Candidates matching "${selectedJob?.title}"`
                        : "Select a job position to find matching candidates"}
                </CardDescription>
            </CardHeader>

            {selectedJd && (
                <CardContent>
                    {matchLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="text-center py-12">
                            <UserRound className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium">No matching candidates found</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Try adjusting your search criteria or select a different job description
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            <Filter className="h-4 w-4 mr-2" />
                                            Sort by
                                            <ChevronDown className="h-4 w-4 ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setSortBy("similarity"); setSortOrder("desc"); }}>
                                            <Star className="h-4 w-4 mr-2" />
                                            Match Score (High to Low)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setSortBy("similarity"); setSortOrder("asc"); }}>
                                            <Star className="h-4 w-4 mr-2" />
                                            Match Score (Low to High)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("asc"); }}>
                                            <UserRound className="h-4 w-4 mr-2" />
                                            Name (A-Z)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("desc"); }}>
                                            <UserRound className="h-4 w-4 mr-2" />
                                            Name (Z-A)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>


                            </div>
                            {isMobile ? (

                                <MatchingUsersMobile />
                            ) :
                                <MatchingUsersDesktop/>

                            }

                        </>
                    )}
                </CardContent>
            )}
        </Card>
    )
}

export default MatchingUsersCard
