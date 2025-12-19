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
        const { firstName, lastName, role, balance } = req.body;
       
        const user = await prisma.user.create({
            data: {
                firstName: firstName,
                lastName: lastName,
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
                firstName: true,
                lastName: true,
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
        const { firstName, lastName, role, balance } = req.body;
        const user = await prisma.user.update({
            where: { id: Number(id), },
            data: {
                firstName: firstName,
                lastName: lastName,
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
// ----------------- Order routes ----------------
// -----------------------------------------------
//Create an order
// Create an order
// Create an order
app.post('/api/orders', async (req, res) => {
    try {
        const {
            clientId,
            products,
            paymentMethod,
            discount,
            notes,
            useTrainerPrice = false,
        } = req.body;

        // Validation
        if (!clientId || !products || products.length === 0 || !paymentMethod) {
            return res.status(400).json({
                error: 'Missing required fields: clientId, products, and paymentMethod'
            });
        }

        const result = await prisma.$transaction(async (prismaTransaction) => {
            // Calculer le montant total
            let totalAmount = 0;
            const orderDetails = [];

            for (const item of products) {
                const product = await prismaTransaction.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) {
                    throw new Error(`Product with id ${item.productId} not found`);
                }

                if (product.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}`);
                }

                // Appliquer le prix entraîneur si useTrainerPrice est true
                const unitPrice = useTrainerPrice ? product.trainerPrice : product.price;
                const totalPrice = unitPrice * item.quantity;
                totalAmount += Number(totalPrice);

                orderDetails.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    totalPrice: totalPrice
                });

                // Décrémenter le stock
                await prismaTransaction.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // Appliquer la réduction (en euros)
            if (discount && discount > 0) {
                totalAmount = Math.max(0, totalAmount - discount);
            }

            // Créer la commande
            const order = await prismaTransaction.order.create({
                data: {
                    clientId: Number(clientId),
                    totalAmount: totalAmount,
                    paymentMethod: paymentMethod,
                    discount: discount || 0,
                    notes: notes || null,
                    useTrainerPrice: useTrainerPrice,
                    products: {
                        create: orderDetails
                    }
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            balance: true
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
            
            // Si paiement par débit de compte
            if (paymentMethod === 'ACCOUNT_DEBIT') {
                await prismaTransaction.user.update({
                    where: { id: Number(clientId) },
                    data: {
                        balance: {
                            decrement: totalAmount
                        }
                    }
                });
            }
            
            // Mettre à jour le rapport quotidien
            const orderDate = new Date();
            orderDate.setHours(0, 0, 0, 0);

            // Calculer les revenus du jour
            const dayStart = new Date(orderDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(orderDate);
            dayEnd.setHours(23, 59, 59, 999);

            const allOrdersToday = await prismaTransaction.order.findMany({
                where: {
                    date: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                }
            });

            let cashRevenue = 0;
            let qrRevenue = 0;
            let creditRevenue = 0;

            allOrdersToday.forEach(o => {
                const amount = Number(o.totalAmount);
                if (o.paymentMethod !== "FREE") {
                    switch (o.paymentMethod) {
                        case "CASH":
                            cashRevenue += amount;
                            break;
                        case "QRCODE":
                            qrRevenue += amount;
                            break;
                        case "ACCOUNT_DEBIT":
                            creditRevenue += amount;
                            break;
                    }
                }
            });

            // Vérifier si un rapport existe pour ce jour
            const existingReport = await prismaTransaction.dailyReport.findUnique({
                where: { date: orderDate }
            });

            if (existingReport) {
                // Rapport existe : mettre à jour les revenus et recalculer endingCash
                // Formule: endingCash = startingCash + cashRevenue + trou (le trou est négatif)
                const trou = Number(existingReport.trou) || 0;
                const endingCash = Number(existingReport.startingCash) + cashRevenue + trou;

                await prismaTransaction.dailyReport.update({
                    where: { date: orderDate },
                    data: {
                        cashRevenue,
                        qrRevenue,
                        creditRevenue,
                        endingCash
                    }
                });
            } else {
                // Pas de rapport : en créer un nouveau
                // startingCash = endingCash du jour précédent
                const previousReport = await prismaTransaction.dailyReport.findFirst({
                    where: {
                        date: { lt: orderDate }
                    },
                    orderBy: { date: 'desc' }
                });

                const startingCash = previousReport ? Number(previousReport.endingCash) : 0;
                const endingCash = startingCash + cashRevenue;

                await prismaTransaction.dailyReport.create({
                    data: {
                        date: orderDate,
                        startingCash,
                        cashRevenue,
                        qrRevenue,
                        creditRevenue,
                        trou: 0,
                        endingCash
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
            orderBy: { id: 'desc' },
            include: {
                client: {
                    select: {
                        id: true,
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
                                description: true,
                                price: true,
                                trainerPrice: true
                            }
                        }
                    }
                }
            }
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
            include: {
                client: {
                    select: {
                        id: true,
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
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        console.error('Error fetching order: ', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Update an order
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            clientId,
            products,
            paymentMethod,
            discount,
            notes,
            useTrainerPrice = false,
        } = req.body;

        // Validation
        if (!clientId || !products || products.length === 0 || !paymentMethod) {
            return res.status(400).json({
                error: 'Missing required fields: clientId, products, and paymentMethod'
            });
        }

        const result = await prisma.$transaction(async (prismaTransaction) => {
            // Récupérer la commande existante
            const existingOrder = await prismaTransaction.order.findUnique({
                where: { id: Number(id) },
                include: {
                    client: true,
                    products: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            if (!existingOrder) {
                throw new Error('Order not found');
            }

            // Restaurer le stock des anciens produits
            for (const orderDetail of existingOrder.products) {
                await prismaTransaction.product.update({
                    where: { id: orderDetail.productId },
                    data: {
                        quantity: {
                            increment: orderDetail.quantity
                        }
                    }
                });
            }

            // Restaurer le solde du client si c'était un débit de compte
            if (existingOrder.paymentMethod === 'ACCOUNT_DEBIT') {
                await prismaTransaction.user.update({
                    where: { id: existingOrder.clientId },
                    data: {
                        balance: {
                            increment: existingOrder.totalAmount
                        }
                    }
                });
            }

            // Supprimer les anciens détails de commande
            await prismaTransaction.orderDetail.deleteMany({
                where: { orderId: Number(id) }
            });

            // Calculer le nouveau montant total
            let totalAmount = 0;
            const orderDetails = [];

            for (const item of products) {
                const product = await prismaTransaction.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) {
                    throw new Error(`Product with id ${item.productId} not found`);
                }

                if (product.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}`);
                }

                // Appliquer le prix entraîneur si useTrainerPrice est true
                const unitPrice = useTrainerPrice ? product.trainerPrice : product.price;
                const totalPrice = unitPrice * item.quantity;
                totalAmount += Number(totalPrice);

                orderDetails.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    totalPrice: totalPrice
                });

                // Décrémenter le stock
                await prismaTransaction.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // Appliquer la réduction (en euros)
            if (discount && discount > 0) {
                totalAmount = Math.max(0, totalAmount - discount);
            }

            // Débiter le compte du nouveau client si nécessaire
            if (paymentMethod === 'ACCOUNT_DEBIT') {
                await prismaTransaction.user.update({
                    where: { id: Number(clientId) },
                    data: {
                        balance: {
                            decrement: totalAmount
                        }
                    }
                });
            }

            // Mettre à jour la commande
            const order = await prismaTransaction.order.update({
                where: { id: Number(id) },
                data: {
                    clientId: Number(clientId),
                    totalAmount: totalAmount,
                    paymentMethod: paymentMethod,
                    discount: discount || 0,
                    notes: notes || null,
                    useTrainerPrice: useTrainerPrice,
                    products: {
                        create: orderDetails
                    }
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            balance: true
                        }
                    },
                    products: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                    price: true,
                                    trainerPrice: true
                                }
                            }
                        }
                    }
                }
            });

            // Mettre à jour la clôture journalière
            const orderDate = new Date(order.date);
            const dateStr = orderDate.toISOString().split('T')[0];

            const allOrdersForDay = await prismaTransaction.order.findMany({
                where: {
                    date: {
                        gte: new Date(dateStr),
                        lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000)
                    }
                }
            });

            const stats = {
                cashRevenue: 0,
                qrRevenue: 0,
                creditRevenue: 0
            };

            allOrdersForDay.forEach(o => {
                const amount = Number(o.totalAmount);
                if (o.paymentMethod === 'CASH') {
                    stats.cashRevenue += amount;
                } else if (o.paymentMethod === 'QRCODE') {
                    stats.qrRevenue += amount;
                } else if (o.paymentMethod === 'ACCOUNT_DEBIT') {
                    stats.creditRevenue += amount;
                }
            });

            const existingClosing = await prismaTransaction.dailyClosing.findUnique({
                where: { date: dateStr }
            });

            if (existingClosing) {
                await prismaTransaction.dailyClosing.update({
                    where: { date: dateStr },
                    data: {
                        cashRevenue: stats.cashRevenue,
                        qrRevenue: stats.qrRevenue,
                        creditRevenue: stats.creditRevenue,
                    }
                });
            }

            return order;
        });

        res.json(result);
    } catch (err) {
        console.error('Error updating order: ', err);
        res.status(500).json({ error: err.message || 'Failed to update order' });
    }
});

// Hard delete an order with balance restoration
app.delete('/api/orders/:id/hard', async (req, res) => {
    try {
        const { id } = req.params;
        const { restoreStock = true, reason } = req.body;
        const existingOrder = await prisma.order.findUnique({
            where: { id: Number(id) },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        balance: true
                    }
                },
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
        const result = await prisma.$transaction(async (prisma) => {
            // Restore the stock
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
            // Restore balance if payment was by account debit
            let balanceRestored = 0;
            if (existingOrder.paymentMethod === 'ACCOUNT_DEBIT') {
                await prisma.user.update({
                    where: { id: existingOrder.clientId },
                    data: {
                        balance: {
                            increment: existingOrder.totalAmount
                        }
                    }
                });
                balanceRestored = existingOrder.totalAmount;
            }
            // Delete OrderDetails
            await prisma.orderDetail.deleteMany({
                where: { orderId: Number(id) }
            });
            // Delete Order
            await prisma.order.delete({
                where: { id: Number(id) }
            });

            // Update DailyReport for the order's date
            const orderDate = new Date(existingOrder.date).toISOString().split('T')[0];
            const dailyReport = await prisma.dailyReport.findUnique({
                where: { date: orderDate }
            });

            if (dailyReport) {
                // Recalculate revenues for this date
                const dayOrders = await prisma.order.findMany({
                    where: {
                        date: {
                            gte: new Date(orderDate + 'T00:00:00.000Z'),
                            lt: new Date(new Date(orderDate).setDate(new Date(orderDate).getDate() + 1))
                        }
                    }
                });

                let cashRevenue = 0;
                let qrRevenue = 0;
                let creditRevenue = 0;

                dayOrders.forEach(order => {
                    const amount = Number(order.totalAmount);
                    switch (order.paymentMethod) {
                        case 'CASH':
                            cashRevenue += amount;
                            break;
                        case 'QRCODE':
                            qrRevenue += amount;
                            break;
                        case 'ACCOUNT_DEBIT':
                            creditRevenue += amount;
                            break;
                    }
                });

                // Calculate new endingCash
                const endingCash = dailyReport.startingCash + cashRevenue + dailyReport.trou;

                // Update the daily report
                await prisma.dailyReport.update({
                    where: { date: orderDate },
                    data: {
                        cashRevenue,
                        qrRevenue,
                        creditRevenue,
                        endingCash
                    }
                });

                // Update startingCash for all subsequent days
                const nextDate = new Date(orderDate);
                nextDate.setDate(nextDate.getDate() + 1);
                const nextDateStr = nextDate.toISOString().split('T')[0];

                const subsequentReports = await prisma.dailyReport.findMany({
                    where: {
                        date: {
                            gte: nextDateStr
                        }
                    },
                    orderBy: {
                        date: 'asc'
                    }
                });

                // Update each subsequent report's startingCash
                let previousEndingCash = endingCash;
                for (const report of subsequentReports) {
                    const newEndingCash = previousEndingCash + report.cashRevenue + report.trou;

                    await prisma.dailyReport.update({
                        where: { id: report.id },
                        data: {
                            startingCash: previousEndingCash,
                            endingCash: newEndingCash
                        }
                    });

                    previousEndingCash = newEndingCash;
                }
            }

            return {
                deletedOrderId: Number(id),
                stockRestored: restoreStock,
                balanceRestored: balanceRestored,
                clientName: `${existingOrder.client.firstName || ''} ${existingOrder.client.lastName || ''}`.trim(),
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
            message: 'Order cancelled successfully',
            data: result
        });
    } catch (err) {
        console.error('Error cancelling order: ', err);
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
});

// -----------------------------------------------
// ---------------- Refund routes ----------------
// -----------------------------------------------
// Create a refund (credit user account)
// Create a refund (credit user account)
// Create a refund (client rembourse sa dette)
app.post('/api/refunds', async (req, res) => {
    try {
        const { userId, amount, paymentMethod, notes } = req.body;
        
        // Validation
        if (!userId || !amount || !paymentMethod) {
            return res.status(400).json({
                error: 'Données manquantes: userId, amount et paymentMethod sont requis'
            });
        }
        
        const refundAmount = Number(amount);
        if (isNaN(refundAmount) || refundAmount <= 0) {
            return res.status(400).json({
                error: 'Le montant du remboursement doit être positif'
            });
        }
        
        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const result = await prisma.$transaction(async (prismaTransaction) => {
            // Créer une commande normale pour le remboursement de dette
            // Le montant est positif car c'est de l'argent qui rentre
            const refundOrder = await prismaTransaction.order.create({
                data: {
                    clientId: Number(userId),
                    totalAmount: refundAmount, // Montant positif - c'est une rentrée d'argent
                    paymentMethod: paymentMethod, // CASH ou QRCODE
                    notes: `[REMBOURSEMENT CRÉDIT] ${notes || 'Remboursement de dette'}`,
                    // Pas de produits pour un remboursement
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            balance: true
                        }
                    },
                    products: true
                }
            });
            
            // Créditer le compte de l'utilisateur (réduire sa dette)
            const updatedUser = await prismaTransaction.user.update({
                where: { id: Number(userId) },
                data: {
                    balance: {
                        increment: refundAmount
                    }
                }
            });
            const refundDate = new Date();
            refundDate.setHours(0, 0, 0, 0);
            return {
                refund: refundOrder,
                newBalance: updatedUser.balance,
                amountRefunded: refundAmount
            };
        });
        
        res.status(201).json(result);
        
    } catch (err) {
        console.error('Error processing refund: ', err);
        res.status(500).json({
            error: 'Internal server error',
            message: err.message || 'An unexpected error occurred'
        });
    }
});

// Get previous day report
app.get('/api/daily-reports/previous/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const currentDate = new Date(date);

        const previousReport = await prisma.dailyReport.findFirst({
            where: {
                date: {
                    lt: currentDate
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        res.json(previousReport);
    } catch (err) {
        console.error('Error fetching previous report: ', err);
        res.status(500).json({ error: 'Failed to fetch previous report' });
    }
});

// -----------------------------------------------
// ------------ Daily Reports routes -------------
// -----------------------------------------------

// Update daily report (specifically for trou updates)
app.put('/api/daily-reports/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const { trou } = req.body;

        const reportDate = new Date(date);

        // Récupérer le rapport existant
        const existingReport = await prisma.dailyReport.findUnique({
            where: { date: reportDate }
        });

        if (existingReport) {
            // Formule: endingCash = startingCash + cashRevenue + trou (le trou est négatif)
            const nouvelleTrou = trou !== undefined ? Number(trou) : Number(existingReport.trou);
            const endingCash = Number(existingReport.startingCash) + Number(existingReport.cashRevenue) + nouvelleTrou;

            const updated = await prisma.dailyReport.update({
                where: { date: reportDate },
                data: {
                    trou: nouvelleTrou,
                    endingCash
                }
            });

            return res.json(updated);
        }

        // Si pas de rapport, en créer un
        const previousReport = await prisma.dailyReport.findFirst({
            where: { date: { lt: reportDate } },
            orderBy: { date: 'desc' }
        });

        const startingCash = previousReport ? Number(previousReport.endingCash) : 0;

        // Calculer les revenus du jour
        const dayStart = new Date(reportDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(reportDate);
        dayEnd.setHours(23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: {
                date: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        let cashRevenue = 0;
        let qrRevenue = 0;
        let creditRevenue = 0;

        orders.forEach(order => {
            const amount = Number(order.totalAmount);
            if (order.paymentMethod !== "FREE") {
                switch (order.paymentMethod) {
                    case "CASH":
                        cashRevenue += amount;
                        break;
                    case "QRCODE":
                        qrRevenue += amount;
                        break;
                    case "ACCOUNT_DEBIT":
                        creditRevenue += amount;
                        break;
                }
            }
        });

        const nouvelleTrou = trou !== undefined ? Number(trou) : 0;
        const endingCash = startingCash + cashRevenue + nouvelleTrou;

        const dailyReport = await prisma.dailyReport.create({
            data: {
                date: reportDate,
                startingCash,
                cashRevenue,
                qrRevenue,
                creditRevenue,
                trou: nouvelleTrou,
                endingCash
            }
        });

        res.json(dailyReport);

    } catch (err) {
        console.error('Error updating daily report:', err);
        res.status(500).json({
            error: 'Failed to update daily report',
            message: err.message
        });
    }
});

// Create or update daily report
app.post('/api/daily-reports', async (req, res) => {
    try {
        const {
            date,
            trou,
            notes,
            closedBy
        } = req.body;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const reportDate = new Date(date);

        // Récupérer le rapport du jour précédent
        const previousReport = await prisma.dailyReport.findFirst({
            where: {
                date: {
                    lt: reportDate
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        const startingCash = previousReport ? Number(previousReport.endingCash) : 0;

        // Calculer les revenus du jour
        const dayStart = new Date(reportDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(reportDate);
        dayEnd.setHours(23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: {
                date: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        let cashRevenue = 0;
        let qrRevenue = 0;
        let creditRevenue = 0;

        orders.forEach(order => {
            const amount = Number(order.totalAmount);
            if (order.paymentMethod !== "FREE") {
                switch (order.paymentMethod) {
                    case "CASH":
                        cashRevenue += amount;
                        break;
                    case "QRCODE":
                        qrRevenue += amount;
                        break;
                    case "ACCOUNT_DEBIT":
                        creditRevenue += amount;
                        break;
                }
            }
        });

        // Formule: endingCash = startingCash + cashRevenue + trou (le trou est négatif)
        const trouValue = trou !== undefined ? Number(trou) : 0;
        const endingCash = startingCash + cashRevenue + trouValue;

        // Créer ou mettre à jour le rapport
        const dailyReport = await prisma.dailyReport.upsert({
            where: {
                date: reportDate
            },
            update: {
                cashRevenue,
                qrRevenue,
                creditRevenue,
                trou: trouValue,
                endingCash,
                notes,
                closedBy
            },
            create: {
                date: reportDate,
                startingCash,
                cashRevenue,
                qrRevenue,
                creditRevenue,
                trou: trouValue,
                endingCash,
                notes,
                closedBy
            }
        });

        res.status(201).json({
            success: true,
            data: dailyReport,
            message: 'Daily report saved successfully'
        });

    } catch (err) {
        console.error('Error creating daily report: ', err);
        res.status(500).json({
            error: 'Failed to create daily report',
            message: err.message
        });
    }
});

// Get daily report for a specific date
app.get('/api/daily-reports/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const reportDate = new Date(date);

        const dailyReport = await prisma.dailyReport.findUnique({
            where: {
                date: reportDate
            }
        });

        if (!dailyReport) {
            return res.status(404).json({ error: 'Daily report not found' });
        }

        res.json(dailyReport);

    } catch (err) {
        console.error('Error fetching daily report:', err);
        res.status(500).json({ error: 'Failed to fetch daily report' });
    }
});

// Get all daily reports
app.get('/api/daily-reports', async (_req, res) => {
    try {
        const reports = await prisma.dailyReport.findMany({
            orderBy: { date: 'desc' }
        });

        res.json(reports);

    } catch (err) {
        console.error('Error fetching daily reports:', err);
        res.status(500).json({ error: 'Failed to fetch daily reports' });
    }
});

// Get starting cash for a specific date (from previous day)
app.get('/api/daily-reports/starting-cash/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const currentDate = new Date(date);

        const previousReport = await prisma.dailyReport.findFirst({
            where: {
                date: {
                    lt: currentDate
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        const startingCash = previousReport ? Number(previousReport.endingCash) : 0;

        res.json({
            startingCash,
            previousDate: previousReport?.date || null,
            foundPreviousReport: !!previousReport
        });

    } catch (err) {
        console.error('Error fetching starting cash:', err);
        res.status(500).json({ error: 'Failed to fetch starting cash' });
    }
});