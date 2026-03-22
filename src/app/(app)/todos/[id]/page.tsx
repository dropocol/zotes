"use client";

import { use } from "react";
import { TodoListDetailPage } from "@/components/todos/todo-list-detail-page";

export default function TodoListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <TodoListDetailPage
      listId={id}
      breadcrumbs={[{ title: "Todos", href: "/todos" }]}
      deleteRedirectUrl="/todos"
    />
  );
}
