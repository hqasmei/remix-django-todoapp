// app/routes/_index.tsx
import {
  json,
  type LoaderFunction,
  type ActionFunction,
} from "@remix-run/node";
import { useLoaderData, Form, useSubmit } from "@remix-run/react";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const API_URL = "http://127.0.0.1:8000/api/todos/";

export const loader: LoaderFunction = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const todos: Todo[] = await response.json();
    return json(todos);
  } catch (error) {
    console.error("Failed to fetch todos:", error);
    return json([]);
  }
};

export default function Index() {
  const todos = useLoaderData<typeof loader>() as Todo[];
  const submit = useSubmit();

  const handleToggle = (todo: Todo) => {
    const formData = new FormData();
    formData.append("_action", "update");
    formData.append("id", todo.id.toString());
    formData.append("completed", todo.completed.toString());
    submit(formData, { method: "post" });
  };

  const handleDelete = (id: number) => {
    const formData = new FormData();
    formData.append("_action", "delete");
    formData.append("id", id.toString());
    submit(formData, { method: "post" });
  };

  return (
    <div className="p-24 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Todo List</h1>
      <Form method="post" className="flex flex-col gap-4">
        <input type="hidden" name="_action" value="create" />
        <input
          type="text"
          name="title"
          placeholder="New todo"
          required
          className="border-2 border-gray-300 rounded-md p-2"
        />
        <button
          type="submit"
          className="bg-blue-500 rounded-md text-white font-bold p-2 hover:bg-blue-700"
        >
          Add Todo
        </button>
      </Form>
      <ul className="space-y-2">
        {todos.map((todo: Todo) => (
          <li key={todo.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo)}
              className="w-4 h-4"
            />
            <span className={todo.completed ? "line-through" : ""}>
              {todo.title}
            </span>
            <button
              onClick={() => handleDelete(todo.id)}
              className="bg-red-500 text-white rounded-md px-2 py-1 text-sm hover:bg-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("_action");

  if (typeof action !== "string") {
    return json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    let response;
    switch (action) {
      case "create": {
        const title = formData.get("title");
        if (typeof title !== "string" || !title) {
          return json({ error: "Invalid title" }, { status: 400 });
        }
        response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, completed: false }),
        });
        break;
      }
      case "update": {
        const id = formData.get("id");
        const completed = formData.get("completed");
        if (typeof id !== "string" || typeof completed !== "string") {
          return json(
            { error: "Invalid id or completed status" },
            { status: 400 }
          );
        }
        response = await fetch(`${API_URL}${id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: completed !== "true" }),
        });
        break;
      }
      case "delete": {
        const id = formData.get("id");
        if (typeof id !== "string") {
          return json({ error: "Invalid id" }, { status: 400 });
        }
        response = await fetch(`${API_URL}${id}/`, {
          method: "DELETE",
        });
        break;
      }
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return json({ success: true });
  } catch (error) {
    console.error(`Failed to ${action} todo:`, error);
    return json({ error: `Failed to ${action} todo` }, { status: 500 });
  }
};
