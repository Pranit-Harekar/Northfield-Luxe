import { redirect } from "next/navigation";

// The Admin Portal has no standalone dashboard — staff navigate directly to
// Products/Users/Orders from the nav bar, so this index route just forwards
// to the first section.
export default function AdminPage() {
  redirect("/admin/products");
}

