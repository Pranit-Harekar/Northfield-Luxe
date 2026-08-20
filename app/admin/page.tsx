import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Admin Portal</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create, edit, and delete catalog products.</p>
          </CardContent>
          <CardFooter>
            <Button nativeButton={false} render={<Link href="/admin/products" />}>
              Open products
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Inventory, Promotions</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Future modules build on the same mock API layer.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
