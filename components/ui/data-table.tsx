// DataTable.tsx
import React, { useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    Column,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    Row,
    Table as TableInstance,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, TableProperties, ArrowUpDown, Search, XCircle, RefreshCw, Loader2, GitCompare } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

// Type for custom filter options
export interface FilterOption<TData, TValue> {
    columnId: string;
    label: string;
    options?: Array<{value: string, label: string}>;
    renderFilter?: (column: Column<TData, TValue>) => React.ReactNode;
}

// Define DataTableProps interface with generic types
export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    showColumnsToggle?: boolean;
    pageSize?: number;
    onRowClick?: (row: Row<TData>) => void;
    enableMultiSort?: boolean;
    enableGlobalFilter?: boolean;
    enableColumnFilters?: boolean;
    itemLabel?: string; 
    showTabs?: boolean;
    tabOptions?: Array<{value: string, label: string}>;
    // New props for dynamic filters
    customFilters?: FilterOption<TData, TValue>[];
    initialFilters?: ColumnFiltersState;
    // Show refresh button flag
    showRefreshButton?: boolean;
    // Refresh function from parent component
    onRefresh?: () => void;
    // Loading state
    isLoading?: boolean;
    // Row count options
    pageSizeOptions?: number[];
    onFilterChange?: (columnId: string, value: string) => void;
    // Props for diff/compare functionality
    onCompare?: (selectedRows: Row<TData>[]) => void;
    jobId?: string;
    diffPageUrl?: string;
    idField?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    showColumnsToggle = true,
    pageSize = 10,
    onRowClick,
    enableMultiSort = false,
    enableGlobalFilter = true,
    enableColumnFilters = true,
    customFilters = [],
    initialFilters = [],
    showRefreshButton = false,
    onRefresh,
    isLoading = false,
    pageSizeOptions = [5, 10, 20, 50, 100],
    onFilterChange,
    onCompare,
    jobId,
    diffPageUrl = "/diff",
    idField = "id",
}: DataTableProps<TData, TValue>) {
    const router = useRouter();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    const [globalFilter, setGlobalFilter] = useState<string>("");
    const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
    
    const table: TableInstance<TData> = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        enableMultiSort,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: currentPageSize,
            },
        },
    });

    // Handle page size change
    const handlePageSizeChange = (value: string) => {
        const newSize = parseInt(value);
        setCurrentPageSize(newSize);
        table.setPageSize(newSize);
    };

    // Function to handle refresh click
    const handleRefreshClick = () => {
        if (onRefresh) {
            onRefresh();
        }
        // Reset to first page
        table.resetPageIndex(true);
    };

    // Function to handle compare button click
    const handleCompareClick = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        
        if (onCompare) {
            onCompare(selectedRows);
            return;
        }
        
        // Default behavior: Navigate to diff page with selected row IDs
        if (selectedRows.length > 0 && diffPageUrl) {
            const selectedIds = selectedRows.map(row => {
                // Get the ID from the row data based on idField
                return (row.original as Record<string, unknown>)[idField] as string;
            });
            
            // Create query string with jobId and selected IDs
            const queryParams = new URLSearchParams();
            if (jobId) queryParams.append('jobId', jobId);
            queryParams.append('ids', selectedIds.join(','));
            
            // Navigate to the diff page
            router.push(`${diffPageUrl}?${queryParams.toString()}`);
        }
    };

    const renderFilterInput = (
        column: Column<TData, TValue>,
        label?: string
    ) => {
        const customFilter = customFilters.find(filter => filter.columnId === column.id);
      
        if (customFilter?.options) {
            return (
                <Select
                    value={(column.getFilterValue() as string) ?? "_all"}
                    onValueChange={(value) => {
                        // Set the filter value
                        column.setFilterValue(value === "_all" ? undefined : value);
                        
                        // Notify parent component if callback provided
                        if (onFilterChange) {
                            onFilterChange(column.id, value);
                        }
                    }}
                >
                    <SelectTrigger className="h-7 w-full">
                        <SelectValue placeholder={`All ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All {label}</SelectItem>
                        {customFilter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }
      
        // Fallback text input
        const columnFilterValue = column.getFilterValue();
        return (
            <Input
                value={(columnFilterValue ?? "") as string}
                onChange={(e) => {
                    column.setFilterValue(e.target.value);
                    // Notify parent component if callback provided
                    if (onFilterChange) {
                        onFilterChange(column.id, e.target.value);
                    }
                }}
                placeholder={`Filter ${column.id}...`}
                className="max-w-sm mt-1"
            />
        );
    };
      
    // Get filteredData count
    const filteredCount = table.getFilteredRowModel().rows.length;
    
    // Get selected rows count
    const selectedRowsCount = Object.keys(rowSelection).length;

    // const renderCustomFiltersArea = () => {
    //     if (customFilters.length === 0) return null;
      
    //     return (
    //       <div className="flex flex-wrap gap-2">
    //         {customFilters.map((filter) => {
    //           // Check if the column exists before trying to access it
    //           const column = table.getColumn(filter.columnId);
    //           if (!column) {
    //             // Skip this filter if the column doesn't exist
    //             console.warn(`[Table] Filter specified for column with id '${filter.columnId}' but this column does not exist in the table definition.`);
    //             return null;
    //           }
      
    //           return (
    //             <div key={filter.columnId} className="min-w-[150px]">
    //               {renderFilterInput(column as Column<TData, TValue>, filter.label)}
    //             </div>
    //           );
    //         })}
    //       </div>
    //     );
    //   };


    const renderCustomFiltersArea = () => {
        if (customFilters.length === 0) return null;
      
        return (
          <div className="flex flex-wrap gap-2">
            {customFilters.map((filter) => {
              const column = table.getColumn(filter.columnId);
console.log("-----",column);
              
              if (!column) return null;
      
              return (
                <div key={filter.columnId} className="min-w-[150px]">
                  {renderFilterInput(column as Column<TData, TValue>, filter.label)}
                </div>
              );
            })}
          </div>
        );
      };
      
    // Generate skeleton rows for loading state
    const renderSkeletonRows = () => {
        return Array(currentPageSize)
            .fill(0)
            .map((_, index) => (
                <TableRow key={`skeleton-row-${index}`}>
                    {columns.map((column, colIndex) => (
                        <TableCell key={`skeleton-cell-${index}-${colIndex}`}>
                            <Skeleton className="h-8 w-full rounded-md" />
                        </TableCell>
                    ))}
                </TableRow>
            ));
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between py-4 gap-2">
                {/* Left: Search Input */}
                <div className="flex-1 flex w-full">
                    {enableGlobalFilter && (
                        <div className="w-full relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Search className="w-4 h-4" />
                            </span>

                            <Input
                                placeholder={searchPlaceholder}
                                value={globalFilter ?? ""}
                                onChange={(event) => setGlobalFilter(event.target.value)}
                                className="w-full h-9 pl-8 pr-8"
                                disabled={isLoading}
                            />

                            {globalFilter && (
                                <button
                                    onClick={() => setGlobalFilter("")}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                                    disabled={isLoading}
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {searchKey && !enableGlobalFilter && (
                        <div className="w-full max-w-md">
                            <Input
                                placeholder={searchPlaceholder}
                                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                                }
                                className="w-full h-9"
                                disabled={isLoading}
                            />
                        </div>
                    )}
                </div>
                
                {/* Middle: Custom Filters */}
                {renderCustomFiltersArea()}
                
                {/* Right: Buttons */}
                <div className="flex items-center gap-2">
                  
                    
                    {/* Refresh Button */}
                    {showRefreshButton && onRefresh && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9"
                            onClick={handleRefreshClick}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            {isLoading ? "Loading..." : "Refresh"}
                        </Button>
                    )}
                    
                    {/* Columns Toggle */}
                    {showColumnsToggle && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="h-9 p-1">
                                <Button variant="outline" size="sm" className="h-9" disabled={isLoading}>
                                    <TableProperties className="h-4 w-4 mr-2" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                      {/* Compare Button - Only show when rows are selected */}
                      {selectedRowsCount > 1 && (
                        <Button 
                            variant="outline" 
                            onClick={handleCompareClick}
                            disabled={isLoading}
                            className="border-green-500 bg-green-200"
                        >
                            <GitCompare className="h-4 w-4 mr-2" />
                            Compare {selectedRowsCount > 0 && `(${selectedRowsCount})`}
                        </Button>
                    )}
                </div>
            </div>

            <div className="border rounded-md font-medium">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            <div className="flex items-center">
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        className={cn(
                                                            "flex items-center space-x-1",
                                                            header.column.getCanSort() && !isLoading ? "cursor-pointer select-none" : ""
                                                        )}
                                                        onClick={!isLoading ? header.column.getToggleSortingHandler() : undefined}
                                                    >
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                        {header.column.getCanSort() && (
                                                            <span>
                                                                {header.column.getIsSorted() === "asc" ? (
                                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                                ) : header.column.getIsSorted() === "desc" ? (
                                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                                ) : (
                                                                    <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {enableColumnFilters && header.column.getCanFilter() && !isLoading && (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="ml-1 h-6 w-6 p-0"
                                                                onClick={(e) => e.stopPropagation()}
                                                                disabled={isLoading}
                                                            >
                                                                <Filter className="h-3 w-3" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-56 p-2" align="start">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium">Filter {header.column.id}</h4>
                                                                {renderFilterInput(header.column as Column<TData, TValue>)}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            renderSkeletonRows()
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() ? "selected" : undefined}
                                    onClick={() => !isLoading && onRowClick && onRowClick(row)}
                                    className={onRowClick && !isLoading ? "cursor-pointer hover:bg-muted" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
    
            <div className="flex items-center space-x-1 justify-between py-4">
                <div className="flex items-center space-x-2">
                    {/* Rows per page selector */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Rows per page</span>
                        <Select 
                            value={currentPageSize.toString()}
                            onValueChange={handlePageSizeChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue>{currentPageSize}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map(size => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Selection count */}
                    {Object.keys(rowSelection).length > 0 && !isLoading && (
                        <span className="text-sm text-muted-foreground ml-4">{Object.keys(rowSelection).length} selected</span>
                    )}
                </div>
                
                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage() || isLoading}
                    >
                        <ChevronFirst className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage() || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="flex items-center gap-1 mx-2">
                        <div className="text-sm font-medium">
                            {isLoading ? (
                                <Skeleton className="h-4 w-20" />
                            ) : (
                                `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`
                            )}
                        </div>
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage() || isLoading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage() || isLoading}
                    >
                        <ChevronLast className="h-4 w-4" />
                    </Button>
                </div>
                
                <div className="text-sm">
                    {!isLoading && filteredCount > 0 ? (
                        <span>Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredCount)} of {filteredCount}</span>
                    ) : isLoading ? (
                        <Skeleton className="h-4 w-32" />
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// Helper functions for column creation remain the same
// Selection column
export function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
    return {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                onClick={(e) => e.stopPropagation()}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    };
}

// Create a sortable column with default configuration
export function createSortableColumn<TData, TValue>(
    id: string,
    header: string,
    accessor: (row: TData) => TValue,
    cellRenderer?: (value: TValue, row: TData) => React.ReactNode
): ColumnDef<TData, TValue> {
    return {
        accessorKey: id,
        header,
        accessorFn: accessor,
        enableSorting: true,
        enableColumnFilter: true,
        cell: cellRenderer
            ? ({ getValue, row }) => cellRenderer(getValue() as TValue, row.original)
            : undefined,
    };
}