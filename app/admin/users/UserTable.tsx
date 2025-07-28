// src/app/admin/users/UserTable.tsx
'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { IUser } from '@/lib/models/User';
import { deleteUser } from '@/app/admin/users/users';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';

export default function UserTable({ 
  users,
  onEdit,
  onRefresh
}: { 
  users: IUser[];
  onEdit: (user: IUser) => void;
  onRefresh: () => void;
}) {
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        toast.success('User deleted successfully');
        onRefresh();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const columns: ColumnDef<IUser>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { 
      accessorKey: 'role', 
      header: 'Role',
      cell: ({ row }) => row.original.role.toUpperCase()
    },
    { 
      accessorKey: 'approved',
      header: 'Status',
      cell: ({ row }) => row.original.approved ? 'Approved' : 'Pending'
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original._id.toString())}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={users} searchKey="name" />;
}