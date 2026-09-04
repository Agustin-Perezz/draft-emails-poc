# Component Patterns

## Size Limits

- **50-line hard limit per component** - no exceptions
- **Proactive split at 40 lines** - do not wait until a component reaches 50 lines
- One concern per file - a form component does not contain a list, a list does not contain a modal

## Page Components

`page.tsx` is composition-only: it imports and arranges components, nothing else. No logic, no inline styles, no conditionals beyond prop-passing. The page (async Server Component) fetches server data and passes it down to presentational components.

```tsx
import { ProductCreateForm } from "./components/ProductCreateForm";
import { ProductHeader } from "./components/ProductHeader";
import { ProductList } from "./components/ProductList";
import { getProducts, getCreateForm } from "./actions";

export default async function Page() {
  const [products, createForm] = await Promise.all([
    getProducts(),
    getCreateForm(),
  ]);

  return (
    <main>
      <ProductHeader />
      <ProductCreateForm createForm={createForm} />
      <ProductList products={products} />
    </main>
  );
}
```

For client-driven pages, keep `page.tsx` as a thin Server Component shell that renders a single client entry component:

```tsx
import { ProductExplorer } from "./components/ProductExplorer";

export default function Page() {
  return <ProductExplorer />;
}
```

## React 19 State

### State Management

```ts
const [count, setCount] = useState(0);
const [books, setBooks] = useState<Book[]>([]);

const doubled = useMemo(() => count * 2, [count]);
const hasBooks = books.length > 0;

useEffect(() => {
  const el = document.getElementById("chart");
  if (el) new Chart(el, { data: chartData });
}, [chartData]);
```

Use `useEffect` only for side effects (DOM, third-party libs). Prefer `useMemo` for derived values. Use Server Components when the value does not need to live on the client.

For actions that mutate state, use Server Actions or `useTransition`/`useActionState` instead of hand-rolled fetch state:

```ts
"use client";
import { useActionState } from "react";
import { createProduct } from "../actions";

const [state, formAction, pending] = useActionState(createProduct, undefined);
```

### Props

```tsx
enum ButtonVariant {
  Default = "default",
  Destructive = "destructive",
}

enum ButtonSize {
  Sm = "sm",
  Md = "md",
  Lg = "lg",
}

type Props = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  children: React.ReactNode;
};

export function Button({
  variant = "default",
  size = "md",
  onClick,
  children,
}: Props) {}
```

Never store derived data in state - compute it with `useMemo` instead:

```ts
// BAD
const [books, setBooks] = useState(data.books);

// GOOD
const books = useMemo(() => data.books, [data.books]);
```

Use two-way binding (`bind:value` equivalents) only when it is strictly necessary. With `use(value)`, you can consume context without `<Context.Consumer>`.

## SOLID Principles

### Single Responsibility

Each component does one thing. See [Frontend Folder Structure](./02_FRONTEND-FOLDER-STRUCTURE.md) for page decomposition.

### Open/Closed

Use `children` and render props so that consumers can extend the component UI without source changes:

```tsx
type Props = {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
};
```

### Liskov Substitution

Wrapper components must accept and spread all standard HTML attributes:

```tsx
import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export function Button({ variant, ...props }: Props) {}
```

### Interface Segregation

Pass only the specific props a component needs:

```tsx
type Props = {
  title: string;
  author: string;
  onDelete: (id: string) => void;
};
```

Do not pass entire objects when only a few fields are needed.

### Dependency Inversion

Use React Context to inject dependencies in client code. Use the container pattern in server code:

```ts
import { createBooksContainer } from "@/modules/books/books.container";

export async function GET(request: Request) {
  const { create } = createBooksContainer();
  // ...
}
```

For Server Actions and Route Handlers, construct the container at call time. Do not share module-level singletons that hold request-scoped resources.