import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config(); // ⚠️ doit être en tout premier

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_API_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS origin: ${process.env.FRONTEND_API_URL}`);
});


//Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
//Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🛑 Shutting down server...');

    try {
        await prisma.$disconnect();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }

    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// -----------------------------------------------
// ----------------- User routes -----------------
// -----------------------------------------------
//Create a user 
app.post('/api/users', async (req, res) => { 
    try {
        const { email, firstName, lastName, phoneNumber, role, balance } = req.body;
        
        const user = await prisma.user.create({
            data: {
                email: email,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                role: role,
                balance: balance,
            }
        });

        res.status(201).json(user);
    } catch (err) {
        console.error('Error creating user: ', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
//Fetch all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { id: 'asc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                balance: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json(users);
    } catch (err) {
        console.error('Error fetching users: ', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
//Fetch a single user
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: Number(id) },
            include: { orders: true, },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching user: ', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
//Updating a user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email, firstName, lastName, phoneNumber, role, balance } = req.body;

        const user = await prisma.user.update({
            where: { id: Number(id), },
            data: {
                email: email,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                role: role,
                balance: balance,
            },
        });

        res.json(user);
    } catch (err) {
        console.error('Error updating user: ', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
//Delete a user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id: Number(id) },
        });

        res.status(204).send();
    } catch (err) {
        console.error('Error deleting user: ', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ------------------------------------------------
// ---------------- Product routes ----------------
// ------------------------------------------------
//Create a product
//TODO assert that the informations are correct
app.post('/api/products', async (req, res) => { 
    try {
        const { name, description, quantity, price, trainerPrice, cost, isActive } = req.body;
        
        const product = await prisma.product.create({
            data: {
                name: name,
                description: description,
                quantity: quantity,
                price: price,
                trainerPrice: trainerPrice,
                cost: cost,
                isActive: isActive,
            }
        });

        res.status(201).json(product);
    } catch (err) {
        console.error('Error creating product: ', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});
//Fetch all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                quantity: true,
                price: true,
                trainerPrice: true,
                cost: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json(products);
    } catch (err) {
        console.error('Error fetching products: ', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
//Fetch a single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        console.error('Error fetching product: ', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});
//Updating a product
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, quantity, price, trainerPrice, cost, isActive } = req.body;

        const product = await prisma.product.update({
            where: { id: Number(id), },
            data: {
                name: name,
                description: description,
                quantity: quantity,
                price: price,
                trainerPrice: trainerPrice,
                cost: cost,
                isActive: isActive,
            },
        });

        res.json(product);
    } catch (err) {
        console.error('Error updating product: ', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});
//Delete a product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({
            where: { id: Number(id) },
        });

        res.status(204).send();
    } catch (err) {
        console.error('Error deleting product: ', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// -----------------------------------------------
// ----------------- User routes -----------------
// -----------------------------------------------
//Create an order
app.post('/api/orders', async (req, res) => {
    try {
        const { clientId, paymentMethod, notes, products } = req.body;
        //Finding the user
        const user = await prisma.user.findUnique({
            where: { id: clientId },
        });
        //Check if the user exists
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        //Finding the products
        const productIds = products.map(p => p.productId);
        const dbProducts = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                isActive: true,
            }
        });
        //Check if the products are active
        if (dbProducts.length !== productIds.length) {
            return res.status(400).json({ error: 'Some products not found or inactive' });
        }
        //Check if stock is available
        for (const orderProduct of products) {
            const dbProduct = dbProducts.find(p => p.id === orderProduct.productId);
            if (dbProduct.quantity < orderProduct.quantity) {
                return res.status(400).json({
                    error: 'Insufficient stock for product: ${dbProduct.name}. Available: ${dbProduct.quantity}, Requested: ${orderProduct.quantity}'
                });
            }
        }
        //Calculate order details
        const orderDetails = products.map(orderProduct => {
            const dbProduct = dbProducts.find(p => p.id === orderProduct.productId);

            const unitPrice = user.role === 'TRAINER' && dbProduct.trainerPrice
                ? dbProduct.trainerPrice : dbProduct.price;
            
            const totalPrice = unitPrice * orderProduct.quantity;

            return {
                productId: orderProduct.id,
                quantity: orderProduct.quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice
            };
        });
        //Calculate total amount
        const totalAmount = orderDetails.reduce((sum, detail) => sum + detail.totalPrice, 0);

        const result = prisma.$transaction(async (prisma) => {
            //Create the order
            const order = await prisma.order.create({
                data: {
                    clientId: clientId,
                    totalAmount: totalAmount,
                    paymentMethod: paymentMethod,
                    notes: notes,
                    products: {
                        create: orderDetails
                    }
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    products: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true
                                }
                            }
                        }
                    }
                }
            });

            //Update product quantities
            for (const orderProduct of products) {
                await prisma.product.update({
                    where: { id: orderProduct.id },
                    data: {
                        quantity: {
                            decrement: orderProduct.quantity
                        }
                    }
                });
            }

            return order;
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating order: ', err);
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
});
//Fetch all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { id: 'asc' },
            include: {
                products: true,
            },
        });

        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders: ', err)
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
//Fetch a single order
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id: Number(id) },
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        console.error('Error fetching order: ', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});
//Update an order

// Hard delete an order
app.delete('/api/orders/:id/hard', async (req, res) => {
    try {
        const { id } = req.params;

        const { restoreStock = true, reason } = req.body;

        const existingOrder = prisma.order.findUnique({
            where: { id: Number(id) },
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const result = prisma.$transaction(async (prisma) => {
            //Restore the stock
            if (restoreStock) {
                for (const orderDetail of existingOrder.products) {
                    await prisma.product.update({
                        where: { id: orderDetail.productId },
                        data: {
                            quantity: {
                                increment: orderDetail.quantity
                            }
                        }
                    });
                }
            }
            //Delete OrderDetails
            await prisma.orderDetail.deleteMany({
                where: { orderId: Number(id) }
            });
            //Delete Order
            await prisma.order.delete({
                where: { id: Number(id) }
            });

            return {
                deletedOrderId: Number(id),
                stockRestored: restoreStock,
                restoredProducts: restoreStock ? existingOrder.products.map(p => ({
                    productId: p.productId,
                    productName: p.product.name,
                    quantity: p.quantity
                })) : [],
                reason: reason || 'No reason provided',
            };
        });

        res.json({
            success: true,
            message: 'Order permanently deleted',
            data: result
        });
    } catch (err) {
        console.error('Error hard deleting order: ', err);
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
});

// TODO add joi
// TODO assert that the email, name, surname and phone number are correct and everything are good