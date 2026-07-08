"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { 
  Users, UserPlus, Trash2, Shield, Settings, 
  Check, X, Loader2, AlertCircle, Plus, Minus,
  Bot, Mail, User as UserIcon, Lock, Search, Filter,
  ChevronLeft, ChevronRight
} from "lucide-react";

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  assigned_bots: { id: string; name: string }[];
}

interface BotItem {
  id: string;
  name: string;
}

export default function UsersPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  // Data States
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // User Creation Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // User Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState("user");
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Bot Assign States
  const [activeAssignUserId, setActiveAssignUserId] = useState<string | null>(null);

  // Fetch Users & Bots on Load
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch users
      const usersResponse = await fetchWithAuth<UserListItem[]>("/users");
      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      } else {
        setError(usersResponse.error?.message || "Failed to load users.");
      }

      // Fetch all bots for assignment options
      const botsResponse = await fetchWithAuth<any>("/bots");
      if (botsResponse.success && botsResponse.data) {
        const botsList = Array.isArray(botsResponse.data) 
          ? botsResponse.data 
          : (botsResponse.data.bots || []);
        setBots(botsList.map((b: any) => ({ id: b.id, name: b.name })));
      }
    } catch (e: any) {
      setError("An unexpected error occurred while loading data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== "superadmin") {
      router.push("/dashboard");
      return;
    }
    loadData();
  }, [currentUser]);

  // Handle page resets when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, itemsPerPage]);

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    if (!newUserName || !newUserEmail || !newUserPassword) {
      setCreateError("All fields are required.");
      setIsCreating(false);
      return;
    }

    try {
      const response = await fetchWithAuth<any>("/users", {
        method: "POST",
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        })
      });

      if (response.success) {
        setIsModalOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("user");
        await loadData();
      } else {
        setCreateError(response.error?.message || "Failed to create user.");
      }
    } catch (err: any) {
      setCreateError("An error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Edit Modal Open Handler
  const openEditModal = (user: UserListItem) => {
    setEditError(null);
    setEditUserId(user.id);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserPassword("");
    setEditUserRole(user.role);
    setIsEditModalOpen(true);
  };

  // Edit User Handler
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setIsUpdating(true);

    if (!editUserName || !editUserEmail) {
      setEditError("Name and Email are required.");
      setIsUpdating(false);
      return;
    }

    try {
      const bodyData: any = {
        name: editUserName,
        email: editUserEmail,
        role: editUserRole
      };
      if (editUserPassword) {
        bodyData.password = editUserPassword;
      }

      const response = await fetchWithAuth<any>(`/users/${editUserId}`, {
        method: "PUT",
        body: JSON.stringify(bodyData)
      });

      if (response.success) {
        setIsEditModalOpen(false);
        await loadData();
      } else {
        setEditError(response.error?.message || "Failed to update user.");
      }
    } catch (err: any) {
      setEditError("An error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle User Status Handler (Activate / Deactivate)
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const actionText = currentStatus ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${actionText} user "${userName}"?`)) {
      return;
    }
    setActionLoading(userId);
    try {
      const response = await fetchWithAuth<any>(`/users/${userId}/status`, {
        method: "PATCH"
      });
      if (response.success) {
        await loadData();
      } else {
        alert(response.error?.message || `Failed to ${actionText} user.`);
      }
    } catch (e) {
      alert(`Failed to ${actionText} user.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete User Handler (Soft-delete/deactivate via backend endpoint)
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${userName}"? This will deactivate their account.`)) {
      return;
    }
    setActionLoading(userId);
    try {
      const response = await fetchWithAuth<any>(`/users/${userId}`, {
        method: "DELETE"
      });
      if (response.success) {
        await loadData();
      } else {
        alert(response.error?.message || "Failed to delete user.");
      }
    } catch (e) {
      alert("Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  // Assign Bot Handler
  const handleAssignBot = async (userId: string, botId: string) => {
    setActionLoading(`${userId}-assign-${botId}`);
    try {
      const response = await fetchWithAuth<any>(`/users/${userId}/bots/${botId}`, {
        method: "POST"
      });
      if (response.success) {
        await loadData();
      } else {
        alert(response.error?.message || "Failed to assign bot.");
      }
    } catch (e) {
      alert("Failed to assign bot.");
    } finally {
      setActionLoading(null);
    }
  };

  // Unassign Bot Handler
  const handleUnassignBot = async (userId: string, botId: string) => {
    setActionLoading(`${userId}-unassign-${botId}`);
    try {
      const response = await fetchWithAuth<any>(`/users/${userId}/bots/${botId}`, {
        method: "DELETE"
      });
      if (response.success) {
        await loadData();
      } else {
        alert(response.error?.message || "Failed to unassign bot.");
      }
    } catch (e) {
      alert("Failed to unassign bot.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter Logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) || 
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
        <p className="text-sm">Loading user directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 text-slate-800 dark:text-slate-100">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-violet-500" /> User Management
          </h1>
          <p className="mt-1.5 text-sm text-slate-505 dark:text-slate-400">
            Control platform access, manage user roles, and assign chatbot collaborators.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer"
        >
          <UserPlus className="h-4 w-4" /> Create User
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-1.5 px-3 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="user">Admin / Bot Manager</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-1.5 px-3 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>

          {/* Items Per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users list grid/table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-6">Name & Email</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Assigned Chatbots</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-850/60 text-sm text-slate-700 dark:text-slate-300">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  {/* Name & Email */}
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-900 dark:text-white">{user.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                  </td>

                  {/* Role badge */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      user.role === "superadmin" 
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}>
                      <Shield className="h-3.5 w-3.5" /> {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {user.id !== currentUser?.id ? (
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleToggleUserStatus(user.id, user.is_active, user.name)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 ${
                            user.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          title={user.is_active ? "Deactivate User" : "Activate User"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              user.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      ) : (
                        <span className="h-5 w-10 flex items-center justify-center">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Your account is always active" />
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        user.is_active 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                      }`}>
                        {user.is_active ? "Active" : "Deactivated"}
                      </span>
                    </div>
                  </td>

                  {/* Assigned Bots List */}
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-2 items-center">
                      {user.assigned_bots.map((b) => (
                        <span key={b.id} className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <Bot className="h-3 w-3 text-indigo-500 dark:text-indigo-400" /> {b.name}
                          {user.role !== "superadmin" && (
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleUnassignBot(user.id, b.id)}
                              className="ml-1 rounded-full hover:bg-slate-205 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors p-0.5"
                              title="Remove access"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}

                      {/* Add assignment dropdown activator */}
                      {user.role !== "superadmin" && (
                        <div className="relative">
                          {activeAssignUserId === user.id ? (
                            <div className="absolute left-0 top-full mt-2 z-10 w-56 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-2xl">
                              <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-850 mb-1">
                                <span>Select Bot</span>
                                <button onClick={() => setActiveAssignUserId(null)} className="text-slate-500 hover:text-slate-750 dark:hover:text-slate-250">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-0.5">
                                {bots
                                  .filter(b => !user.assigned_bots.some(ab => ab.id === b.id))
                                  .map(b => (
                                    <button
                                      key={b.id}
                                      onClick={() => {
                                        handleAssignBot(user.id, b.id);
                                        setActiveAssignUserId(null);
                                      }}
                                      className="flex w-full items-center justify-start rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 text-left transition-colors"
                                    >
                                      {b.name}
                                    </button>
                                  ))}
                                {bots.filter(b => !user.assigned_bots.some(ab => ab.id === b.id)).length === 0 && (
                                  <div className="text-center py-3 text-xs text-slate-500">
                                    No available bots.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveAssignUserId(user.id)}
                              className="inline-flex items-center gap-1 rounded border border-dashed border-slate-350 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                              title="Assign Bot Access"
                            >
                              <Plus className="h-3 w-3" /> Link Bot
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={actionLoading !== null}
                        onClick={() => openEditModal(user)}
                        className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Edit User"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                          className="rounded p-1.5 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* No Users Found state */}
              {totalItems === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Users className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
                    <p className="font-medium text-sm">No users match your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls footer */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{endIndex}</span> of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> users
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {getPageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                      currentPage === pageNum
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                        : "border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-violet-500" /> Create Platform User
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-655 dark:text-red-400">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <p>{createError}</p>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="•••••••• (min 6 characters)"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Access Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                >
                  <option value="user">Admin / Bot Manager</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 px-4 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Creating...
                    </>
                  ) : (
                    "Save User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-violet-500" /> Edit Platform User
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-650 dark:text-red-400">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <p>{editError}</p>
              </div>
            )}

            <form onSubmit={handleEditUser} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              {/* Reset Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Reset Password
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">(Optional)</span>
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Access Role
                </label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  disabled={editUserId === currentUser?.id}
                  className="block w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                >
                  <option value="user">Admin / Bot Manager</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 px-4 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
