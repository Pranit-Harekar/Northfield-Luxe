// Mock admin users API: list/edit/delete customer + staff accounts.

import { getDB } from "../db/schema";
import type { Role, User } from "../db/types";
import { ApiError, withApiSimulation } from "./client";
import { getSession } from "./auth";

export async function listUsers(): Promise<User[]> {
  return withApiSimulation("GET", "/api/admin/users", async () => {
    const db = await getDB();
    const users = await db.getAll("users");
    return users.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });
}

export interface UpdateUserInput {
  name: string;
  email: string;
  role: Role;
}

export async function updateUser(id: string, patch: UpdateUserInput): Promise<User> {
  return withApiSimulation(
    "PUT",
    `/api/admin/users/${id}`,
    async () => {
      const db = await getDB();
      const user = await db.get("users", id);
      if (!user) throw new ApiError(404, "User not found");
      const normalizedEmail = patch.email.trim().toLowerCase();
      const matches = await db.getAllFromIndex("users", "by-email", normalizedEmail);
      if (matches.some((match) => match.id !== id)) {
        throw new ApiError(409, "Another account already uses that email");
      }
      const updated: User = { ...user, name: patch.name.trim(), email: normalizedEmail, role: patch.role };
      await db.put("users", updated);
      return updated;
    },
    patch,
  );
}

/**
 * Deletes a user account. Their past orders are preserved but flagged
 * `archived` so admin order history stays intact even though the account
 * (and its `userId` foreign key) no longer resolves to a live user.
 */
export async function deleteUser(id: string): Promise<void> {
  return withApiSimulation("DELETE", `/api/admin/users/${id}`, async () => {
    const session = getSession();
    if (session?.userId === id) {
      throw new ApiError(400, "You cannot delete your own account.");
    }
    const db = await getDB();
    const user = await db.get("users", id);
    if (!user) throw new ApiError(404, "User not found");

    const orders = await db.getAllFromIndex("orders", "by-user", id);
    await Promise.all(
      orders.map((order) => db.put("orders", { ...order, archived: true })),
    );

    await db.delete("users", id);
  });
}
