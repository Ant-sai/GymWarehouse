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
app.post('/api/orders', async (req, res) => {
    try {
        const { 
            clientId, 
            products, 
            paymentMethod, 
            discount, 
            notes,
            trou  // Nouveau: accepter le trou dans la requête
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
                
                const unitPrice = product.price;
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
            
            // Appliquer la réduction
            if (discount && discount > 0) {
                totalAmount = totalAmount * (1 - discount / 100);
            }
            
            // Créer la commande avec le trou
            const order = await prismaTransaction.order.create({
                data: {
                    clientId: Number(clientId),
                    totalAmount: totalAmount,
                    paymentMethod: paymentMethod,
                    discount: discount || 0,
                    notes: notes || null,
                    trou: trou || null,  // Sauvegarder le trou
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

// Get previous day closing (to get fond de caisse for next day)
app.get('/api/daily-closing/previous/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const currentDate = new Date(date);
        
        // Get the most recent closing before this date
        const previousClosing = await prisma.dailyClosing.findFirst({
            where: {
                date: {
                    lt: currentDate
                }
            },
            orderBy: {
                date: 'desc'
            }
        });
        
        res.json(previousClosing);
    } catch (err) {
        console.error('Error fetching previous closing: ', err);
        res.status(500).json({ error: 'Failed to fetch previous closing' });
    }
});

// -----------------------------------------------
// ------------ Daily Closing routes -------------
// -----------------------------------------------

// Create or update daily closing with logic for starting cash fund
app.post('/api/daily-closing', async (req, res) => {
    try {
        const { 
            date, 
            cashRevenue, 
            qrRevenue, 
            creditRevenue, 
            trou, 
            fondCaisse, 
            notes, 
            closedBy 
        } = req.body;
        
        // Validation
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        
        const closingDate = new Date(date);
        
        // Récupérer le fond de caisse du jour précédent
        const previousClosing = await prisma.dailyClosing.findFirst({
            where: {
                date: {
                    lt: closingDate
                }
            },
            orderBy: {
                date: 'desc'
            }
        });
        
        // Le début du fond de caisse est le fond de caisse du jour précédent
        // Si c'est le premier jour, on utilise 0 ou une valeur par défaut
        const startingCashFund = previousClosing ? previousClosing.fondCaisse : 0;
        
        // Créer ou mettre à jour la clôture journalière
        const dailyClosing = await prisma.dailyClosing.upsert({
            where: {
                date: closingDate
            },
            update: {
                cashRevenue,
                qrRevenue,
                creditRevenue,
                trou: trou || 0,
                fondCaisse,
                startingCashFund, // Sauvegarde du début de fond de caisse
                notes,
                closedBy,
                closedAt: new Date()
            },
            create: {
                date: closingDate,
                cashRevenue,
                qrRevenue,
                creditRevenue,
                trou: trou || 0,
                fondCaisse,
                startingCashFund, // Sauvegarde du début de fond de caisse
                notes,
                closedBy,
                closedAt: new Date()
            }
        });
        
        res.status(201).json({
            success: true,
            data: dailyClosing,
            message: 'Daily closing saved successfully'
        });
        
    } catch (err) {
        console.error('Error creating daily closing: ', err);
        res.status(500).json({ 
            error: 'Failed to create daily closing',
            message: err.message 
        });
    }
});

// Get daily closing for a specific date
// Ligne 434 - Après app.get('/api/daily-closing/:date')

// Update daily closing (specifically for trou updates)
app.put('/api/daily-closing/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const { trou } = req.body;
        
        const closingDate = new Date(date);
        
        // Calculer le fond de caisse du jour précédent
        const previousClosing = await prisma.dailyClosing.findFirst({
            where: {
                date: {
                    lt: closingDate
                }
            },
            orderBy: {
                date: 'desc'
            }
        });
        
        const startingCashFund = previousClosing ? previousClosing.fondCaisse : 0;
        
        // Récupérer les stats du jour pour calculer les revenus
        const dayStart = new Date(closingDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(closingDate);
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
        });
        
        const fondCaisse = cashRevenue - (trou || 0);
        
        // Créer ou mettre à jour la clôture
        const dailyClosing = await prisma.dailyClosing.upsert({
            where: {
                date: closingDate
            },
            update: {
                cashRevenue,
                qrRevenue,
                creditRevenue,
                trou: trou || 0,
                fondCaisse,
                startingCashFund,
                closedAt: new Date()
            },
            create: {
                date: closingDate,
                cashRevenue,
                qrRevenue,
                creditRevenue,
                trou: trou || 0,
                fondCaisse,
                startingCashFund,
                closedAt: new Date()
            }
        });
        
        res.json(dailyClosing);
        
    } catch (err) {
        console.error('Error updating daily closing: ', err);
        res.status(500).json({ 
            error: 'Failed to update daily closing',
            message: err.message 
        });
    }
});

// Get starting cash fund for a specific date (from previous day)
app.get('/api/daily-closing/starting-fund/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const currentDate = new Date(date);
        
        // Trouver la clôture du jour précédent
        const previousClosing = await prisma.dailyClosing.findFirst({
            where: {
                date: {
                    lt: currentDate
                }
            },
            orderBy: {
                date: 'desc'
            }
        });
        
        // Le début du fond de caisse = fond de caisse du jour précédent
        const startingCashFund = previousClosing ? previousClosing.fondCaisse : 0;
        
        res.json({
            startingCashFund,
            previousDate: previousClosing?.date || null,
            foundPreviousClosing: !!previousClosing
        });
        
    } catch (err) {
        console.error('Error fetching starting cash fund: ', err);
        res.status(500).json({ error: 'Failed to fetch starting cash fund' });
    }
});