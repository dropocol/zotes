"use client";

import { use } from "react";
import { TodoListDetailPage } from "@/components/todos/todo-list-detail-page";

export default function TodoListPage({
  params,
}: {
  params: Promise<{ id: string; todoListId: string }>;
}) {
  const { id, todoListId } = use(params);

  return (
    <TodoListDetailPage
      listId={todoListId}
      breadcrumbs={[
        { title: "Projects", href: "/projects" },
        { title: id, href: `/projects/${id}` },
      ]}
      deleteRedirectUrl={`/projects/${id}`}
      hasProject
    />
  );
}
