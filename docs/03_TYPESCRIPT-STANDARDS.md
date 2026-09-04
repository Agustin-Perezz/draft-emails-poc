# TypeScript Standards

## `satisfies` Operator

Use `satisfies` to validate an object against a type. It keeps the most specific inferred type:

```ts
const config = { width: 100, height: 200 } satisfies Dimensions;
```

## Type Guards

```ts
function isAdmin(user: User): user is Admin {
  return user.role === "admin";
}

function assertString(val: unknown): asserts val is string {
  if (typeof val !== "string") throw new Error("Expected string");
}
```

## Type vs Interface

Use `type` by default. Only use `interface` when you need declaration merging or when you extend another type:

```ts
// BAD — interface used when type suffices
interface CreateBookParams {
  title: string;
  author: string;
}

// GOOD — type as the default
export type CreateBookParams = {
  title: string;
  author: string;
};
```

## Utility Types

Prefer built-in utilities to keep types DRY. For React component props, use `ComponentProps`:

```tsx
import type { ComponentProps } from "react";

type BookSummary = Pick<Book, "id" | "title">;
type BookWithoutAuthor = Omit<Book, "author">;
type ButtonHandler = ReturnType<typeof createHandler>;
type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };
```

## Strict Rules

- **`any` is forbidden** — use `unknown` with type guards
- **When you need both validation and inference, use `satisfies` instead of explicit annotations**

  ```ts
  export enum OrderStatus {
    Pending = "pending",
    Preparing = "preparing",
    OutForDelivery = "out_for_delivery",
    Delivered = "delivered",
  }

  export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
    OrderStatus.Pending,
    OrderStatus.Preparing,
    OrderStatus.OutForDelivery,
  ];
  ```

## Coding Conventions

Always use braces for `if` statements:

```ts
// BAD
if (!query) return this.books;

// GOOD
if (!query) {
  return this.books;
}
```

If a utility function exists in more than one file, extract it to `@/lib/` and import from there. The `@/*` path alias maps to `./src/*` (see `tsconfig.json`).