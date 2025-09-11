# Prisma Schema Documentation

## Overview

This document describes the database schema for an e-commerce/order management system built with Prisma and PostgreSQL. The schema supports user management, product catalog, order processing, and role-based pricing.

## Database Configuration

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}
```

- **Database**: PostgreSQL
- **Client Generation**: Custom output directory (`../generated/prisma`)

## Models

### User Model

Represents system users with role-based access and account balance functionality.

```prisma
model User {
  id            Int         @id @default(autoincrement())
  email         String      @unique
  firstName     String?     
  lastName      String?     
  phoneNumber   String?     @unique @map("phone_number")
  role          Role        @default(USER)
  balance       Decimal     @default(0) @db.Decimal(10, 2)
  
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  orders        Order[]

  @@map("users")
}
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **email**: Unique email address (required)
- **firstName**: Optional first name
- **lastName**: Optional last name
- **phoneNumber**: Optional unique phone number (maps to `phone_number` in DB)
- **role**: User role enum (default: USER)
- **balance**: Account balance with 2 decimal precision (default: 0.00)
- **createdAt**: Timestamp of record creation
- **updatedAt**: Timestamp of last update (auto-managed)

#### Relationships
- **orders**: One-to-many relationship with Order model

---

### Product Model

Represents products in the catalog with inventory and pricing information.

```prisma
model Product {
  id            Int         @id @default(autoincrement())
  name          String
  description   String?
  quantity      Int         @default(0)
  price         Decimal     @db.Decimal(10, 2)
  trainerPrice  Decimal     @db.Decimal(10, 2) @map("trainer_price")
  cost          Decimal     @db.Decimal(10, 2)
  isActive      Boolean     @default(true)

  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  
  orderDetails  OrderDetail[]

  @@map("products")
}
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **name**: Product name (required)
- **description**: Optional product description
- **quantity**: Available stock quantity (default: 0)
- **price**: Regular price for standard users
- **trainerPrice**: Special price for trainer role users (maps to `trainer_price`)
- **cost**: Product cost/wholesale price (required)
- **isActive**: Whether product is available for purchase (default: true)
- **createdAt**: Timestamp of record creation
- **updatedAt**: Timestamp of last update

#### Relationships
- **orderDetails**: One-to-many relationship with OrderDetail model

---

### Order Model

Represents customer orders with payment and status tracking.

```prisma
model Order {
  id            Int         @id @default(autoincrement())

  client        User        @relation(fields: [clientId], references: [id])
  clientId      Int

  totalAmount   Decimal     @map("total_amount") @db.Decimal(10, 2)
  status        OrderStatus @default(PENDING)
  date          DateTime    @default(now())
  paymentMethod PaymentType @map("payment_method")

  notes         String?

  products      OrderDetail[]

  @@map("orders")
}
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **clientId**: Foreign key referencing User model
- **totalAmount**: Total order amount (maps to `total_amount`)
- **status**: Order status enum (default: PENDING)
- **date**: Order creation timestamp
- **paymentMethod**: Payment method enum (maps to `payment_method`)
- **notes**: Optional order notes or special instructions

#### Relationships
- **client**: Many-to-one relationship with User model
- **products**: One-to-many relationship with OrderDetail model

---

### OrderDetail Model

Junction table representing individual products within orders with pricing history.

```prisma
model OrderDetail {
  id            Int         @id @default(autoincrement())

  order         Order       @relation(fields: [orderId], references: [id])
  orderId       Int
  
  product       Product     @relation(fields: [productId], references: [id])
  productId     Int         

  quantity      Int

  unitPrice     Decimal     @map("unit_price") @db.Decimal(10, 2)
  totalPrice   Decimal     @map("total_price") @db.Decimal(10, 2)

  @@map("order_details")
}
```

#### Fields
- **id**: Primary key, auto-incrementing integer
- **orderId**: Foreign key referencing Order model
- **productId**: Foreign key referencing Product model
- **quantity**: Quantity of product ordered
- **unitPrice**: Price per unit at time of order (maps to `unit_price`)
- **totalPrice**: Total price for this line item (maps to `total_price`)

#### Relationships
- **order**: Many-to-one relationship with Order model
- **product**: Many-to-one relationship with Product model

## Enums

### Role Enum

Defines user roles in the system.

```prisma
enum Role {
  TRAINER
  USER
}
```

- **TRAINER**: Trainer users with access to special pricing
- **USER**: Regular users (default role)

### PaymentType Enum

Defines available payment methods.

```prisma
enum PaymentType {
  CREDITCARD
  PAYPAL
  CASH
  QRCODE
}
```

- **CREDITCARD**: Credit card payment
- **PAYPAL**: PayPal payment
- **CASH**: Cash payment
- **QRCODE**: QR code payment

### OrderStatus Enum

Defines order lifecycle states.

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

- **PENDING**: Order placed but not confirmed (default)
- **CONFIRMED**: Order confirmed and being processed
- **SHIPPED**: Order has been shipped
- **DELIVERED**: Order delivered to customer
- **CANCELLED**: Order cancelled

## Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     users       │         │    products     │
├─────────────────┤         ├─────────────────┤
│ • id (PK)       │         │ • id (PK)       │
│ • email (UQ)    │         │ • name          │
│ • firstName     │         │ • description   │
│ • lastName      │         │ • quantity      │
│ • phone_number  │         │ • price         │
│ • role          │         │ • trainer_price │
│ • balance       │         │ • cost          │
│ • created_at    │         │ • isActive      │
│ • updated_at    │         │ • created_at    │
└─────────────────┘         │ • updated_at    │
         │                  └─────────────────┘
         │ 1:∞                       │
         │                           │ 1:∞
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│     orders      │         │ order_details   │
├─────────────────┤         ├─────────────────┤
│ • id (PK)       │◄────────┤ • id (PK)       │
│ • clientId (FK) │   1:∞   │ • orderId (FK)  │
│ • total_amount  │         │ • productId(FK) │
│ • status        │         │ • quantity      │
│ • date          │         │ • unit_price    │
│ • payment_method│         │ • total_price   │
│ • notes         │         └─────────────────┘
└─────────────────┘
```

## Key Features

### 1. **Role-Based Pricing**
- Products have separate pricing for trainers (`trainerPrice`) and regular users (`price`)
- User roles determine which pricing applies

### 2. **Financial Precision**
- All monetary values use `Decimal(10, 2)` for precise currency calculations
- Prevents floating-point rounding errors in financial operations

### 3. **Price History**
- Order details store `unitPrice` and `totalPrice` at time of order
- Preserves historical pricing data even if product prices change

### 4. **Inventory Management**
- Products track available `quantity`
- `isActive` flag controls product availability

### 5. **Order Lifecycle**
- Complete order status tracking from pending to delivered
- Support for order cancellation

### 6. **Audit Trail**
- All models include `createdAt` and `updatedAt` timestamps
- Automatic update tracking via Prisma's `@updatedAt`

## Usage Examples

### Creating a User
```typescript
const user = await prisma.user.create({
  data: {
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "USER"
  }
});
```

### Creating a Product
```typescript
const product = await prisma.product.create({
  data: {
    name: "Protein Powder",
    description: "High-quality whey protein",
    quantity: 100,
    price: 29.99,
    trainerPrice: 24.99,
    cost: 15.00
  }
});
```

### Creating an Order with Details
```typescript
const order = await prisma.order.create({
  data: {
    clientId: 1,
    totalAmount: 59.98,
    paymentMethod: "CREDITCARD",
    products: {
      create: [
        {
          productId: 1,
          quantity: 2,
          unitPrice: 29.99,
          totalPrice: 59.98
        }
      ]
    }
  }
});
```

### Querying Orders with Relations
```typescript
const orders = await prisma.order.findMany({
  include: {
    client: true,
    products: {
      include: {
        product: true
      }
    }
  }
});
```

## Migration Commands

```bash
# Generate migration after schema changes
npx prisma migrate dev --name migration_name

# Generate Prisma client
npx prisma generate

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

This schema provides a robust foundation for an e-commerce system with proper data integrity, financial precision, and comprehensive order management capabilities.