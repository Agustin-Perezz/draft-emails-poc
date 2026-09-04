# Coding Standards

Clean code guidelines (Uncle Bob). When in doubt, optimize for the next reader, not the current writer.

## Constants over magic values

Never inline numbers or strings with semantic meaning. Extract them to named constants so intent is explicit and changes touch one place.

```ts
// ❌ Bad — magic number, magic string
if (user.role === "admin") {
  setSessionTimeout(1800);
}

// ✅ Good — named constants
const ADMIN_ROLE = "admin" as const;
const SESSION_TIMEOUT_SECONDS = 1800;

if (user.role === ADMIN_ROLE) {
  setSessionTimeout(SESSION_TIMEOUT_SECONDS);
}
```

## Short, single-responsibility functions

A function does one thing. If you can describe it with "and", split it. Prefer pure functions over ones with hidden side effects.

```ts
// ❌ Bad — does three things
function processOrder(order: Order): void {
  validateOrder(order);
  order.items.forEach((i) => (i.price *= 0.9)); // discount
  saveOrder(order);
  sendEmail(order.email, "Order confirmed");
}

// ✅ Good — each step named, composable
function applyDiscount(item: OrderItem): OrderItem {
  return { ...item, price: item.price * DISCOUNT_RATE };
}

function processOrder(order: Order): void {
  const validated = validateOrder(order);
  const discounted = { ...validated, items: validated.items.map(applyDiscount) };
  saveOrder(discounted);
  notifyCustomer(discounted);
}
```

## Guard clauses over nesting

Return early to flatten deep nesting. The happy path stays at the top level, unindented.

```ts
// ❌ Bad — arrow-shaped, buries the happy path
function getDiscount(user: User): number | null {
  if (user.isActive) {
    if (user.orders.length > 10) {
      if (user.isVip) {
        return VIP_DISCOUNT;
      } else {
        return LOYALTY_DISCOUNT;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}

// ✅ Good — guard clauses, happy path last and flat - Early return
function getDiscount(user: User): number | null {
  if (!user.isActive) return null;
  if (user.orders.length <= MIN_ORDERS_FOR_DISCOUNT) return null;
  if (!user.isVip) return LOYALTY_DISCOUNT;
  return VIP_DISCOUNT;
}
```

## Descriptive names

Names state **what** and **why**, not how. Do not use `data`, `temp`, `info`, or `x` outside narrow numeric scope.

```ts
// ❌ Bad
const d = new Date();
const u = users.filter((x) => x.a);

// ✅ Good
const trialStartDate = new Date();
const activeUsers = users.filter((user) => user.isActive);
```

## DRY — extract, do not duplicate

The third time you write the same logic, extract it. But do not pre-extract for hypothetical reuse (YAGNI).

```ts
// ❌ Bad — repeated formatting
formatDate(order.createdAt);
formatDate(invoice.createdAt);
formatDate(report.createdAt);

// ✅ Good — one helper, one truth
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS);
}
```

## Comments sparingly

Code explains **how**. Comments explain **why** when the why is not obvious. Do not restate the code.

```ts
// ❌ Bad — restates code
// Loop over users
for (const user of users) { ... }

// ✅ Good — explains a non-obvious decision
// ponytail: naive scan, index a Set if this list exceeds ~1000 entries
const exists = users.some((u) => u.id === targetId);
```

## Boring code on purpose

Prefer plain, step-by-step code over dense one-liners. Named intermediate variables document intent better than a chained expression. Optimize for readability, not line count.

```ts
// ❌ Bad — clever, hard to scan, intent hidden
const totalValue = allTasks
  .filter((task) => task.type === COMPLETED)
  .map((task) => task.value)
  .reduce((sum, value) => sum + value, 0) || 0;

// ✅ Good — boring, obvious, each step explains itself
const completedTasks = allTasks.filter((task) => task.type === COMPLETED);
const totalValue = completedTasks.reduce((sum, task) => sum + task.value, 0);
```
