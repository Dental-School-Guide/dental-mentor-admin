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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Trash, Trash2 } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export type User = SupabaseUser & {
  conversationCount?: number
}

function ActionsCell({ user }: { user: User }) {
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [deleteUserOpen, setDeleteUserOpen] = React.useState(false)
  const [deleteConversationsOpen, setDeleteConversationsOpen] = React.useState(false)

  const handleDeleteUser = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        setDeleteUserOpen(false)
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteConversations = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}/conversations`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Conversations deleted successfully')
        setDeleteConversationsOpen(false)
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete conversations')
      }
    } catch (error) {
      toast.error('Failed to delete conversations')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-accent">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDeleteConversationsOpen(true)} 
            disabled={deleteLoading} 
            className="gap-2 mb-2 bg-yellow-500 hover:bg-yellow-600 text-black focus:bg-yellow-600 focus:text-black"
          >
            <Trash2 className="h-4 w-4" />
            Delete Conversations
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setDeleteUserOpen(true)} 
            disabled={deleteLoading} 
            className="gap-2 bg-red-600 hover:bg-red-700 text-white focus:bg-red-700 focus:text-white"
          >
            <Trash className="h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Conversations Dialog */}
      <Dialog open={deleteConversationsOpen} onOpenChange={setDeleteConversationsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversations</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all conversations for <strong>{user.email}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConversationsOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConversations}
              disabled={deleteLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {deleteLoading ? "Deleting..." : "Delete Conversations"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user <strong>{user.email}</strong>? This will also delete all their conversations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteUserOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <div className="font-semibold text-sm px-2">Email</div>
      )
    },
    cell: ({ row }) => <div className="font-medium px-2 py-3">{row.getValue("email") || "N/A"}</div>,
    size: 250,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <div className="font-semibold text-sm px-2">Created At</div>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return (
        <div className="px-2 py-3 text-sm">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "last_sign_in_at",
    header: ({ column }) => {
      return (
        <div className="font-semibold text-sm px-2">Last Sign In</div>
      )
    },
    cell: ({ row }) => {
      const lastSignIn = row.getValue("last_sign_in_at") as string | null
      if (!lastSignIn) return <div className="text-muted-foreground px-2 py-3 text-sm">Never</div>
      const date = new Date(lastSignIn)
      return (
        <div className="px-2 py-3 text-sm">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "email_confirmed_at",
    header: () => <div className="font-semibold text-sm px-2">Status</div>,
    cell: ({ row }) => {
      const confirmed = row.getValue("email_confirmed_at")
      return (
        <div className="px-2 py-3">
          {confirmed ? (
            <Badge variant="default">Confirmed</Badge>
          ) : (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>
      )
    },
    size: 120,
  },
  {
    id: "conversationCount",
    header: () => <div className="font-semibold text-sm px-2 text-center">Total Conversations</div>,
    cell: ({ row }) => {
      const count = row.original.conversationCount || 0
      return (
        <div className="px-2 py-3 text-center font-medium">
          {count}
        </div>
      )
    },
    size: 150,
  },
  {
    id: "actions",
    header: () => <div className="font-semibold text-sm text-center px-2">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-center px-2 py-3">
        <ActionsCell user={row.original} />
      </div>
    ),
    size: 80,
  },
]

interface DataTableProps {
  data: User[]
}

export function UsersDataTable({ data }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
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
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} user(s) total.
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
