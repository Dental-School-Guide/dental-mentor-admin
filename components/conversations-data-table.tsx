"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Eye } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BulkDeleteConversationsButton } from "@/components/bulk-delete-conversations-button"

export type Conversation = {
  id: string
  resource_id: string
  user_id: string
  user_email?: string | null
  title: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export const columns: ColumnDef<Conversation>[] = [
  {
    accessorKey: "title",
    header: () => <div className="font-semibold text-sm px-2">Title</div>,
    cell: ({ row }) => (
      <div className="font-medium max-w-md truncate px-2 py-3">
        {row.getValue("title") || "Untitled Conversation"}
      </div>
    ),
    size: 300,
  },
  {
    accessorKey: "user_email",
    header: () => <div className="font-semibold text-sm px-2">User Email</div>,
    cell: ({ row }) => (
      <div className="text-sm px-2 py-3">
        {row.getValue("user_email") || (
          <span className="text-muted-foreground italic">No email</span>
        )}
      </div>
    ),
    size: 250,
  },
  {
    accessorKey: "user_id",
    header: () => <div className="font-semibold text-sm px-2">User ID</div>,
    cell: ({ row }) => (
      <div className="font-mono text-xs text-muted-foreground truncate max-w-[150px] px-2 py-3">
        {row.getValue("user_id")}
      </div>
    ),
    size: 180,
  },
  {
    accessorKey: "created_at",
    header: () => <div className="font-semibold text-sm px-2">Created At</div>,
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return (
        <div className="text-sm px-2 py-3">
          <div className="whitespace-nowrap">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: "updated_at",
    header: () => <div className="font-semibold text-sm px-2">Last Updated</div>,
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"))
      return (
        <div className="text-sm px-2 py-3">
          <div className="whitespace-nowrap">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      )
    },
    size: 140,
  },
  {
    id: "actions",
    header: () => <div className="font-semibold text-sm text-center px-2">Actions</div>,
    cell: ({ row }) => {
      const conversation = row.original
      return (
        <div className="flex justify-center px-2 py-3">
          <Link href={`/dashboard/conversations/${conversation.id}`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </Link>
        </div>
      )
    },
    size: 100,
  },
]

interface DataTableProps {
  data: Conversation[]
}

export function ConversationsDataTable({ data }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updated_at", desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Input
            placeholder="Filter by title..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="max-w-[250px]"
          />
          <Input
            placeholder="Filter by email..."
            value={(table.getColumn("user_email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("user_email")?.setFilterValue(event.target.value)
            }
            className="max-w-[250px]"
          />
          <Input
            placeholder="Filter by user ID..."
            value={(table.getColumn("user_id")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("user_id")?.setFilterValue(event.target.value)
            }
            className="max-w-[250px]"
          />
        </div>
        <BulkDeleteConversationsButton />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  No conversations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} conversation(s) total.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
