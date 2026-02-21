import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TodoListContainer } from "@/components/todos/todo-list-container";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function TodoListPage({
  params,
}: {
  params: Promise<{ id: string; todoListId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { id: projectId, todoListId } = await params;

  const todoList = await prisma.todoList.findFirst({
    where: {
      id: todoListId,
      userId: session.user.id,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  if (!todoList) {
    notFound();
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Projects", href: "/projects" },
        { title: todoList.project.name, href: `/projects/${projectId}` },
        { title: todoList.name },
      ]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{todoList.name}</h1>
          {todoList.description && (
            <p className="text-muted-foreground mt-1">{todoList.description}</p>
          )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Todo List</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{todoList.name}&quot;? This will
                also delete all items in this list. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <form
                action={async () => {
                  "use server";
                  await fetch(
                    `${process.env.AUTH_URL}/api/todo-lists/${todoListId}`,
                    {
                      method: "DELETE",
                    }
                  );
                }}
              >
                <Button type="submit" variant="destructive">
                  Delete
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <TodoListContainer todoListId={todoListId} />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
