// src/app/admin/users/page.tsx
"use client";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserForm from "./UserForm";
import UserTable from "./UserTable";
import { IUser } from "@/lib/models/User";
import { getUsers } from "@/app/admin/users/users";
import Link from "next/link";

export default function AdminUsersPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  const { data: users, mutate, error } = useSWR<IUser[]>("users", getUsers);

  const handleRefresh = () => {
    mutate();
    setOpenDialog(false);
    setSelectedUser(null);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold mb-2">User Management</h1>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedUser(null)}>Add New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? "Edit User" : "Create New User"}
              </DialogTitle>
            </DialogHeader>
            <UserForm user={selectedUser} onSuccess={handleRefresh} />
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <div className="text-red-500">Failed to load users</div>
      ) : (
        <UserTable
          users={users || []}
          onEdit={(user) => {
            setSelectedUser(user);
            setOpenDialog(true);
          }}
          onRefresh={mutate}
        />
      )}
    </div>
  );
}
