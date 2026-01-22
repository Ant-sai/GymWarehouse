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

// -----------------------------------------------
// ------------ Helper Functions -----------------
// -----------------------------------------------

// 🔄 Fonction helper pour recalculer tous les jours suivants
async function recalculateFollowingDays(startDate) {
    try {
        console.log('\n🔄 ========== RECALCUL EN CASCADE ==========');
        console.log(`📅 Date de départ: ${startDate.toISOString().split('T')[0]}`);

        // Récupérer tous les rapports après la date donnée
        const followingReports = await prisma.dailyReport.findMany({
            where: {
                date: {
                    gt: startDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        console.log(`📊 Nombre de jours à recalculer: ${followingReports.length}`);

        // Pour chaque rapport, recalculer le startingCash et endingCash
        for (const report of followingReports) {
            const reportDate = new Date(report.date).toISOString().split('T')[0];

            // Récupérer le rapport du jour précédent
            const previousReport = await prisma.dailyReport.findFirst({
                where: {
                    date: {
                        lt: report.date
                    }
                },
                orderBy: {
                    date: 'desc'
                }
            });

            const oldStartingCash = Number(report.startingCash);
            const oldEndingCash = Number(report.endingCash);

            const newStartingCash = previousReport ? Number(previousReport.endingCash) : 0;
            const cashRevenue = Number(report.cashRevenue);
            const trou = Number(report.trou);
            const retrait = Number(report.retrait || 0);
            const newEndingCash = newStartingCash + cashRevenue + trou + retrait;

            console.log(`\n  📆 ${reportDate}:`);
            console.log(`    Ancien: startingCash=${oldStartingCash}€, endingCash=${oldEndingCash}€`);
            console.log(`    Calcul: ${newStartingCash}€ (début) + ${cashRevenue}€ (espèces) + ${trou}€ (trou) + ${retrait}€ (retrait) = ${newEndingCash}€`);
            console.log(`    Nouveau: startingCash=${newStartingCash}€, endingCash=${newEndingCash}€`);

            await prisma.dailyReport.update({
                where: { date: report.date },
                data: {
                    startingCash: newStartingCash,
                    endingCash: newEndingCash
                }
            });
        }

        console.log(`\n✅ Recalculé ${followingReports.length} jours suivants`);
        console.log('🔄 =========================================\n');
    } catch (error) {
        console.error('❌ Erreur lors du recalcul des jours suivants:', error);
        throw error;
    }
}

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


// Get all users with their balance for Excel export
app.get('/api/users/export/balances', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: [
                { role: 'asc' },
                { lastName: 'asc' },
                { firstName: 'asc' }
            ],
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                balance: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true
                    }
                }
            }
        });

        const exportData = users.map(user => ({
            userId: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            role: user.role,
            balance: Number(user.balance),
            totalOrders: user._count.orders,
            memberSince: user.createdAt,
            status: Number(user.balance) < 0 ? 'DETTE' : Number(user.balance) > 0 ? 'CRÉDIT' : 'ÉQUILIBRÉ'
        }));

        // Calculer des statistiques globales
        const statistics = {
            totalUsers: users.length,
            totalTrainers: users.filter(u => u.role === 'TRAINER').length,
            totalRegularUsers: users.filter(u => u.role === 'USER').length,
            totalBalance: users.reduce((sum, u) => sum + Number(u.balance), 0),
            totalDebt: users.reduce((sum, u) => Number(u.balance) < 0 ? sum + Number(u.balance) : sum, 0),
            totalCredit: users.reduce((sum, u) => Number(u.balance) > 0 ? sum + Number(u.balance) : sum, 0),
            usersInDebt: users.filter(u => Number(u.balance) < 0).length,
            usersWithCredit: users.filter(u => Number(u.balance) > 0).length
        };

        res.json({
            exportDate: new Date(),
            statistics,
            data: exportData
        });

    } catch (err) {
        console.error('Error fetching user balances for export:', err);
        res.status(500).json({
            error: 'Failed to fetch user balances for export',
            message: err.message
        });
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
        const productId = Number(id);

        // Vérifier si le produit est utilisé dans des commandes
        const orderDetailsCount = await prisma.orderDetail.count({
            where: { productId: productId }
        });

        if (orderDetailsCount > 0) {
            return res.status(400).json({
                error: 'Impossible de supprimer ce produit car il est utilisé dans des commandes existantes',
                orderCount: orderDetailsCount
            });
        }

        await prisma.product.delete({
            where: { id: productId },
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

                // Décrémenter le stock principal
                await prismaTransaction.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });

                // Décrémenter le stock journalier si le produit a un suivi journalier
                if (product.hasDailyStock) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const dailyStock = await prismaTransaction.dailyStock.findUnique({
                        where: {
                            productId_date: {
                                productId: item.productId,
                                date: today
                            }
                        }
                    });

                    if (dailyStock) {
                        await prismaTransaction.dailyStock.update({
                            where: {
                                productId_date: {
                                    productId: item.productId,
                                    date: today
                                }
                            },
                            data: {
                                quantity: {
                                    decrement: item.quantity
                                }
                            }
                        });
                    }
                }
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
                // Formule: endingCash = startingCash + cashRevenue + trou + retrait (trou et retrait sont négatifs)
                const trou = Number(existingReport.trou) || 0;
                const retrait = Number(existingReport.retrait) || 0;
                const endingCash = Number(existingReport.startingCash) + cashRevenue + trou + retrait;

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
                        retrait: 0,
                        endingCash
                    }
                });
            }
            
            return order;
        });

        // 🔄 Recalculer les jours suivants car les revenus ont changé
        const orderDate = new Date();
        orderDate.setHours(0, 0, 0, 0);
        await recalculateFollowingDays(orderDate).catch(err => {
            console.error('⚠️ Erreur lors du recalcul (non bloquant):', err);
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
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders: ', err)
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get all orders for Excel export (must be before /api/orders/:id)
app.get('/api/orders/export', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { date: 'desc' },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                products: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        const exportData = orders.map(order => ({
            orderId: order.id,
            clientName: `${order.client.firstName || ''} ${order.client.lastName || ''}`.trim(),
            date: order.date,
            products: order.products.map(p => ({
                name: p.product.name,
                quantity: p.quantity,
                unitPrice: Number(p.unitPrice),
                totalPrice: Number(p.totalPrice)
            })),
            totalAmount: Number(order.totalAmount),
            paymentMethod: order.paymentMethod,
            discount: order.discount || 0,
            notes: order.notes
        }));

        res.json(exportData);
    } catch (err) {
        console.error('Error fetching orders for export:', err);
        res.status(500).json({
            error: 'Failed to fetch orders for export',
            message: err.message
        });
    }
});

// Get orders from a specific date for Excel export
app.get('/api/orders/export/from/:date', async (req, res) => {
    try {
        const { date } = req.params;

        const startDate = new Date(date);
        if (isNaN(startDate.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        startDate.setHours(0, 0, 0, 0);

        const orders = await prisma.order.findMany({
            where: {
                date: {
                    gte: startDate
                }
            },
            orderBy: { date: 'desc' },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                products: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        const exportData = orders.map(order => ({
            orderId: order.id,
            clientName: `${order.client.firstName || ''} ${order.client.lastName || ''}`.trim(),
            date: order.date,
            products: order.products.map(p => ({
                name: p.product.name,
                quantity: p.quantity,
                unitPrice: Number(p.unitPrice),
                totalPrice: Number(p.totalPrice)
            })),
            totalAmount: Number(order.totalAmount),
            paymentMethod: order.paymentMethod,
            discount: order.discount || 0,
            notes: order.notes
        }));

        res.json({
            startDate: startDate,
            count: orders.length,
            data: exportData
        });

    } catch (err) {
        console.error('Error fetching orders for export:', err);
        res.status(500).json({
            error: 'Failed to fetch orders for export',
            message: err.message
        });
    }
});

// Get orders between two dates for Excel export
app.get('/api/orders/export/range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'startDate and endDate query parameters are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                }
            },
            orderBy: { date: 'desc' },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                products: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        const exportData = orders.map(order => ({
            orderId: order.id,
            clientName: `${order.client.firstName || ''} ${order.client.lastName || ''}`.trim(),
            date: order.date,
            products: order.products.map(p => ({
                name: p.product.name,
                quantity: p.quantity,
                unitPrice: Number(p.unitPrice),
                totalPrice: Number(p.totalPrice)
            })),
            totalAmount: Number(order.totalAmount),
            paymentMethod: order.paymentMethod,
            discount: order.discount || 0,
            notes: order.notes
        }));

        res.json({
            startDate: start,
            endDate: end,
            count: orders.length,
            data: exportData
        });

    } catch (err) {
        console.error('Error fetching orders for export:', err);
        res.status(500).json({
            error: 'Failed to fetch orders for export',
            message: err.message
        });
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
            useTrainerPrice,
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
            const existingOrderDate = new Date(existingOrder.date);
            existingOrderDate.setHours(0, 0, 0, 0);

            for (const orderDetail of existingOrder.products) {
                await prismaTransaction.product.update({
                    where: { id: orderDetail.productId },
                    data: {
                        quantity: {
                            increment: orderDetail.quantity
                        }
                    }
                });

                // Restaurer le stock journalier si le produit a un suivi journalier
                if (orderDetail.product.hasDailyStock) {
                    const dailyStock = await prismaTransaction.dailyStock.findUnique({
                        where: {
                            productId_date: {
                                productId: orderDetail.productId,
                                date: existingOrderDate
                            }
                        }
                    });

                    if (dailyStock) {
                        await prismaTransaction.dailyStock.update({
                            where: {
                                productId_date: {
                                    productId: orderDetail.productId,
                                    date: existingOrderDate
                                }
                            },
                            data: {
                                quantity: {
                                    increment: orderDetail.quantity
                                }
                            }
                        });
                    }
                }
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

                // Décrémenter le stock principal
                await prismaTransaction.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });

                // Décrémenter le stock journalier si le produit a un suivi journalier
                if (product.hasDailyStock) {
                    const dailyStock = await prismaTransaction.dailyStock.findUnique({
                        where: {
                            productId_date: {
                                productId: item.productId,
                                date: existingOrderDate
                            }
                        }
                    });

                    if (dailyStock) {
                        await prismaTransaction.dailyStock.update({
                            where: {
                                productId_date: {
                                    productId: item.productId,
                                    date: existingOrderDate
                                }
                            },
                            data: {
                                quantity: {
                                    decrement: item.quantity
                                }
                            }
                        });
                    }
                }
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

            // Mettre à jour le rapport quotidien
            const orderDate = new Date(order.date);
            orderDate.setHours(0, 0, 0, 0);

            const dayStart = new Date(orderDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(orderDate);
            dayEnd.setHours(23, 59, 59, 999);

            const allOrdersForDay = await prismaTransaction.order.findMany({
                where: {
                    date: {
                        gte: dayStart,
                        lt: dayEnd
                    }
                }
            });

            let cashRevenue = 0;
            let qrRevenue = 0;
            let creditRevenue = 0;

            allOrdersForDay.forEach(o => {
                const amount = Number(o.totalAmount);
                if (o.paymentMethod === 'CASH') {
                    cashRevenue += amount;
                } else if (o.paymentMethod === 'QRCODE') {
                    qrRevenue += amount;
                } else if (o.paymentMethod === 'ACCOUNT_DEBIT') {
                    creditRevenue += amount;
                }
            });

            const existingReport = await prismaTransaction.dailyReport.findUnique({
                where: { date: orderDate }
            });

            if (existingReport) {
                // Recalculer endingCash avec les nouveaux revenus
                const endingCash = Number(existingReport.startingCash) + cashRevenue + Number(existingReport.trou);

                await prismaTransaction.dailyReport.update({
                    where: { date: orderDate },
                    data: {
                        cashRevenue,
                        qrRevenue,
                        creditRevenue,
                        endingCash
                    }
                });

                // Mettre à jour les jours suivants
                const nextDate = new Date(orderDate);
                nextDate.setDate(nextDate.getDate() + 1);
                nextDate.setHours(0, 0, 0, 0);

                const subsequentReports = await prismaTransaction.dailyReport.findMany({
                    where: {
                        date: {
                            gte: nextDate
                        }
                    },
                    orderBy: {
                        date: 'asc'
                    }
                });

                let previousEndingCash = endingCash;
                for (const report of subsequentReports) {
                    const newEndingCash = Number(previousEndingCash) + Number(report.cashRevenue) + Number(report.trou);

                    await prismaTransaction.dailyReport.update({
                        where: { id: report.id },
                        data: {
                            startingCash: previousEndingCash,
                            endingCash: newEndingCash
                        }
                    });

                    previousEndingCash = newEndingCash;
                }
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
                                name: true,
                                hasDailyStock: true
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
            const deletedOrderDate = new Date(existingOrder.date);
            deletedOrderDate.setHours(0, 0, 0, 0);

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

                    // Restaurer le stock journalier si le produit a un suivi journalier
                    if (orderDetail.product.hasDailyStock) {
                        const dailyStock = await prisma.dailyStock.findUnique({
                            where: {
                                productId_date: {
                                    productId: orderDetail.productId,
                                    date: deletedOrderDate
                                }
                            }
                        });

                        if (dailyStock) {
                            await prisma.dailyStock.update({
                                where: {
                                    productId_date: {
                                        productId: orderDetail.productId,
                                        date: deletedOrderDate
                                    }
                                },
                                data: {
                                    quantity: {
                                        increment: orderDetail.quantity
                                    }
                                }
                            });
                        }
                    }
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
            const orderDate = new Date(existingOrder.date);
            orderDate.setHours(0, 0, 0, 0);
            const dailyReport = await prisma.dailyReport.findUnique({
                where: { date: orderDate }
            });

            if (dailyReport) {
                // Recalculate revenues for this date
                const dayStart = new Date(orderDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(orderDate);
                dayEnd.setHours(23, 59, 59, 999);

                const dayOrders = await prisma.order.findMany({
                    where: {
                        date: {
                            gte: dayStart,
                            lt: dayEnd
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
                // endingCash = startingCash + cashRevenue + trou (trou peut être négatif pour une dépense)
                const endingCash = Number(dailyReport.startingCash) + cashRevenue + Number(dailyReport.trou);

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
                nextDate.setHours(0, 0, 0, 0);

                const subsequentReports = await prisma.dailyReport.findMany({
                    where: {
                        date: {
                            gte: nextDate
                        }
                    },
                    orderBy: {
                        date: 'asc'
                    }
                });

                // Update each subsequent report's startingCash and endingCash
                let previousEndingCash = endingCash;
                for (const report of subsequentReports) {
                    const newEndingCash = Number(previousEndingCash) + Number(report.cashRevenue) + Number(report.trou);

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

            // Mettre à jour le rapport quotidien
            const refundDate = new Date();
            refundDate.setHours(0, 0, 0, 0);

            // Calculer les revenus du jour
            const dayStart = new Date(refundDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(refundDate);
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
                where: { date: refundDate }
            });

            if (existingReport) {
                // Rapport existe : mettre à jour les revenus et recalculer endingCash
                const trou = Number(existingReport.trou) || 0;
                const endingCash = Number(existingReport.startingCash) + cashRevenue + trou;

                await prismaTransaction.dailyReport.update({
                    where: { date: refundDate },
                    data: {
                        cashRevenue,
                        qrRevenue,
                        creditRevenue,
                        endingCash
                    }
                });

                // Mettre à jour les jours suivants
                const nextDate = new Date(refundDate);
                nextDate.setDate(nextDate.getDate() + 1);
                nextDate.setHours(0, 0, 0, 0);

                const subsequentReports = await prismaTransaction.dailyReport.findMany({
                    where: {
                        date: {
                            gte: nextDate
                        }
                    },
                    orderBy: {
                        date: 'asc'
                    }
                });

                let previousEndingCash = endingCash;
                for (const report of subsequentReports) {
                    const newEndingCash = Number(previousEndingCash) + Number(report.cashRevenue) + Number(report.trou);

                    await prismaTransaction.dailyReport.update({
                        where: { id: report.id },
                        data: {
                            startingCash: previousEndingCash,
                            endingCash: newEndingCash
                        }
                    });

                    previousEndingCash = newEndingCash;
                }
            } else {
                // Pas de rapport : en créer un nouveau
                const previousReport = await prismaTransaction.dailyReport.findFirst({
                    where: {
                        date: { lt: refundDate }
                    },
                    orderBy: { date: 'desc' }
                });

                const startingCash = previousReport ? Number(previousReport.endingCash) : 0;
                const endingCash = startingCash + cashRevenue;

                await prismaTransaction.dailyReport.create({
                    data: {
                        date: refundDate,
                        startingCash,
                        cashRevenue,
                        qrRevenue,
                        creditRevenue,
                        trou: 0,
                        endingCash
                    }
                });
            }

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
// ------------ Standby Orders routes ------------
// -----------------------------------------------

// Get all standby orders
app.get('/api/standby-orders', async (req, res) => {
    try {
        const standbyOrders = await prisma.standbyOrder.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        balance: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Parse cartData JSON for each order
        const ordersWithParsedCart = standbyOrders.map(order => ({
            ...order,
            cart: JSON.parse(order.cartData)
        }));

        res.json(ordersWithParsedCart);
    } catch (err) {
        console.error('Error fetching standby orders:', err);
        res.status(500).json({ error: 'Failed to fetch standby orders' });
    }
});

// Create a standby order
app.post('/api/standby-orders', async (req, res) => {
    try {
        const {
            userId,
            cart,
            paymentMethod,
            notes,
            discountValue,
            discountComment
        } = req.body;

        // Validation - seul le panier est obligatoire
        if (!cart || cart.length === 0) {
            return res.status(400).json({
                error: 'Missing required field: cart must contain at least one item'
            });
        }

        const standbyOrder = await prisma.standbyOrder.create({
            data: {
                userId: userId ? Number(userId) : null,
                paymentMethod: paymentMethod || null,
                notes: notes || null,
                discountValue: discountValue || 0,
                discountComment: discountComment || null,
                cartData: JSON.stringify(cart)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        balance: true
                    }
                }
            }
        });

        res.status(201).json({
            ...standbyOrder,
            cart: JSON.parse(standbyOrder.cartData)
        });
    } catch (err) {
        console.error('Error creating standby order:', err);
        res.status(500).json({
            error: 'Failed to create standby order',
            message: err.message
        });
    }
});

// Delete a standby order
app.delete('/api/standby-orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.standbyOrder.delete({
            where: { id: Number(id) }
        });

        res.status(204).send();
    } catch (err) {
        console.error('Error deleting standby order:', err);
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Standby order not found' });
        }
        res.status(500).json({ error: 'Failed to delete standby order' });
    }
});

// -----------------------------------------------
// ------------ Daily Reports routes -------------
// -----------------------------------------------

// Update daily report (specifically for trou updates)
app.put('/api/daily-reports/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const { trou, retrait } = req.body;

        const reportDate = new Date(date);
        const dateStr = reportDate.toISOString().split('T')[0];

        console.log('\n💰 ========== MISE À JOUR DU RAPPORT ==========');
        console.log(`📅 Date: ${dateStr}`);
        if (trou !== undefined) console.log(`🔢 Nouveau trou: ${trou}€`);
        if (retrait !== undefined) console.log(`🔢 Nouveau retrait: ${retrait}€`);

        // Récupérer le rapport existant
        const existingReport = await prisma.dailyReport.findUnique({
            where: { date: reportDate }
        });

        if (existingReport) {
            console.log(`📊 Rapport existant trouvé:`);
            console.log(`   - startingCash: ${existingReport.startingCash}€`);
            console.log(`   - cashRevenue: ${existingReport.cashRevenue}€`);
            console.log(`   - trou actuel: ${existingReport.trou}€`);
            console.log(`   - retrait actuel: ${existingReport.retrait}€`);
            console.log(`   - endingCash actuel: ${existingReport.endingCash}€`);

            // Formule: endingCash = startingCash + cashRevenue + trou + retrait (trou et retrait sont négatifs)
            const nouvelleTrou = trou !== undefined ? Number(trou) : Number(existingReport.trou);
            const nouveauRetrait = retrait !== undefined ? Number(retrait) : Number(existingReport.retrait);
            const endingCash = Number(existingReport.startingCash) + Number(existingReport.cashRevenue) + nouvelleTrou + nouveauRetrait;

            console.log(`🧮 Calcul: ${existingReport.startingCash}€ + ${existingReport.cashRevenue}€ + ${nouvelleTrou}€ + ${nouveauRetrait}€ = ${endingCash}€`);

            const updateData = { endingCash };
            if (trou !== undefined) updateData.trou = nouvelleTrou;
            if (retrait !== undefined) updateData.retrait = nouveauRetrait;

            const updated = await prisma.dailyReport.update({
                where: { date: reportDate },
                data: updateData
            });

            console.log(`✅ Rapport mis à jour - nouveau endingCash: ${endingCash}€`);

            // 🔄 RECALCULER tous les jours suivants car le fond de début change
            await recalculateFollowingDays(reportDate);

            console.log('💰 ==========================================\n');

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

// Get daily report for a specific date (avec création automatique si manquant)
app.get('/api/daily-reports/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const reportDate = new Date(date);
        const dateStr = reportDate.toISOString().split('T')[0];

        console.log(`\n📖 GET /api/daily-reports/${dateStr}`);

        let dailyReport = await prisma.dailyReport.findUnique({
            where: {
                date: reportDate
            }
        });

        if (!dailyReport) {
            console.log(`   ⚠️  Rapport non trouvé pour ${dateStr}, création automatique...`);

            // Récupérer le rapport du jour précédent pour avoir le startingCash
            const previousReport = await prisma.dailyReport.findFirst({
                where: {
                    date: { lt: reportDate }
                },
                orderBy: { date: 'desc' }
            });

            const startingCash = previousReport ? Number(previousReport.endingCash) : 0;

            if (previousReport) {
                const prevDate = new Date(previousReport.date).toISOString().split('T')[0];
                console.log(`   📅 Jour précédent trouvé: ${prevDate} (endingCash: ${previousReport.endingCash}€)`);
            } else {
                console.log(`   📅 Aucun jour précédent, startingCash par défaut: 0€`);
            }

            // Calculer les revenus du jour à partir des commandes
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

            const trou = 0; // Par défaut, pas de trou
            const endingCash = startingCash + cashRevenue + trou;

            console.log(`   💰 Calcul du rapport:`);
            console.log(`      - startingCash: ${startingCash}€`);
            console.log(`      - cashRevenue: ${cashRevenue}€ (${orders.length} commandes)`);
            console.log(`      - qrRevenue: ${qrRevenue}€`);
            console.log(`      - creditRevenue: ${creditRevenue}€`);
            console.log(`      - trou: ${trou}€`);
            console.log(`      - endingCash: ${endingCash}€`);

            // Créer le rapport
            dailyReport = await prisma.dailyReport.create({
                data: {
                    date: reportDate,
                    startingCash,
                    cashRevenue,
                    qrRevenue,
                    creditRevenue,
                    trou,
                    endingCash
                }
            });

            console.log(`   ✅ Rapport créé automatiquement pour ${dateStr}`);
        } else {
            console.log(`   ✅ Rapport trouvé:`);
            console.log(`      - startingCash: ${dailyReport.startingCash}€`);
            console.log(`      - cashRevenue: ${dailyReport.cashRevenue}€`);
            console.log(`      - trou: ${dailyReport.trou}€`);
            console.log(`      - endingCash: ${dailyReport.endingCash}€`);
        }

        res.json(dailyReport);

    } catch (err) {
        console.error('Error fetching/creating daily report:', err);
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
        const dateStr = currentDate.toISOString().split('T')[0];

        console.log(`\n💵 GET /api/daily-reports/starting-cash/${dateStr}`);

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

        if (previousReport) {
            const prevDate = new Date(previousReport.date).toISOString().split('T')[0];
            console.log(`   ✅ Jour précédent trouvé: ${prevDate}`);
            console.log(`      - endingCash du jour précédent: ${previousReport.endingCash}€`);
            console.log(`      → startingCash pour ${dateStr}: ${startingCash}€`);
        } else {
            console.log(`   ⚠️  Aucun jour précédent trouvé`);
            console.log(`      → startingCash pour ${dateStr}: 0€ (par défaut)`);
        }

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

// -----------------------------------------------
// ------------ Daily Stock routes ---------------
// -----------------------------------------------

// Get all products with daily stock tracking enabled
app.get('/api/products/daily-stock-enabled', async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { hasDailyStock: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
                trainerPrice: true,
                hasDailyStock: true
            }
        });
        res.json(products);
    } catch (err) {
        console.error('Error fetching daily stock products:', err);
        res.status(500).json({ error: 'Failed to fetch daily stock products' });
    }
});

// Toggle daily stock tracking for a product
app.put('/api/products/:id/daily-stock-toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const { hasDailyStock } = req.body;

        const product = await prisma.product.update({
            where: { id: Number(id) },
            data: { hasDailyStock: hasDailyStock }
        });

        res.json(product);
    } catch (err) {
        console.error('Error toggling daily stock:', err);
        res.status(500).json({ error: 'Failed to toggle daily stock' });
    }
});

// Get daily stock for a specific date
app.get('/api/daily-stock/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const stockDate = new Date(date);

        // Get all products with daily stock enabled
        const productsWithDailyStock = await prisma.product.findMany({
            where: { hasDailyStock: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
                trainerPrice: true
            }
        });

        // Get daily stock entries for this date
        const dailyStocks = await prisma.dailyStock.findMany({
            where: { date: stockDate },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        quantity: true,
                        price: true,
                        trainerPrice: true
                    }
                }
            }
        });

        // Create a map of productId -> dailyStock
        const stockMap = new Map(dailyStocks.map(ds => [ds.productId, ds]));

        // Combine products with their daily stock (or 0 if not set)
        const result = productsWithDailyStock.map(product => ({
            productId: product.id,
            productName: product.name,
            mainStock: product.quantity,
            dailyStock: stockMap.has(product.id) ? stockMap.get(product.id).quantity : 0,
            price: product.price,
            trainerPrice: product.trainerPrice,
            dailyStockId: stockMap.has(product.id) ? stockMap.get(product.id).id : null
        }));

        res.json({
            date: stockDate,
            stocks: result
        });
    } catch (err) {
        console.error('Error fetching daily stock:', err);
        res.status(500).json({ error: 'Failed to fetch daily stock' });
    }
});

// Set/Update daily stock for a product on a specific date
app.put('/api/daily-stock/:date/:productId', async (req, res) => {
    try {
        const { date, productId } = req.params;
        const { quantity } = req.body;
        const stockDate = new Date(date);

        // Upsert the daily stock entry
        const dailyStock = await prisma.dailyStock.upsert({
            where: {
                productId_date: {
                    productId: Number(productId),
                    date: stockDate
                }
            },
            update: {
                quantity: Number(quantity)
            },
            create: {
                productId: Number(productId),
                date: stockDate,
                quantity: Number(quantity)
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        quantity: true
                    }
                }
            }
        });

        res.json(dailyStock);
    } catch (err) {
        console.error('Error setting daily stock:', err);
        res.status(500).json({ error: 'Failed to set daily stock' });
    }
});

// Adjust daily stock (add or remove quantity)
app.post('/api/daily-stock/:date/:productId/adjust', async (req, res) => {
    try {
        const { date, productId } = req.params;
        const { adjustment } = req.body; // positive to add, negative to remove
        const stockDate = new Date(date);

        // Get current daily stock or create with 0
        const existing = await prisma.dailyStock.findUnique({
            where: {
                productId_date: {
                    productId: Number(productId),
                    date: stockDate
                }
            }
        });

        const currentQuantity = existing ? existing.quantity : 0;
        const newQuantity = Math.max(0, currentQuantity + Number(adjustment));

        const dailyStock = await prisma.dailyStock.upsert({
            where: {
                productId_date: {
                    productId: Number(productId),
                    date: stockDate
                }
            },
            update: {
                quantity: newQuantity
            },
            create: {
                productId: Number(productId),
                date: stockDate,
                quantity: newQuantity
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        quantity: true
                    }
                }
            }
        });

        res.json({
            ...dailyStock,
            previousQuantity: currentQuantity,
            adjustment: Number(adjustment)
        });
    } catch (err) {
        console.error('Error adjusting daily stock:', err);
        res.status(500).json({ error: 'Failed to adjust daily stock' });
    }
});

// Initialize daily stock from previous day or from main stock
app.post('/api/daily-stock/:date/initialize', async (req, res) => {
    try {
        const { date } = req.params;
        const { fromPreviousDay = false } = req.body;
        const stockDate = new Date(date);

        // Get products with daily stock enabled
        const products = await prisma.product.findMany({
            where: { hasDailyStock: true }
        });

        if (products.length === 0) {
            return res.json({ message: 'No products with daily stock enabled', created: 0 });
        }

        let sourceStocks = [];

        if (fromPreviousDay) {
            // Get previous day's stock
            const previousDate = new Date(stockDate);
            previousDate.setDate(previousDate.getDate() - 1);

            const previousStocks = await prisma.dailyStock.findMany({
                where: { date: previousDate }
            });

            sourceStocks = products.map(product => {
                const prev = previousStocks.find(ps => ps.productId === product.id);
                return {
                    productId: product.id,
                    quantity: prev ? prev.quantity : 0
                };
            });
        } else {
            // Use main stock as starting point
            sourceStocks = products.map(product => ({
                productId: product.id,
                quantity: product.quantity
            }));
        }

        // Create or update daily stocks
        const results = await Promise.all(
            sourceStocks.map(stock =>
                prisma.dailyStock.upsert({
                    where: {
                        productId_date: {
                            productId: stock.productId,
                            date: stockDate
                        }
                    },
                    update: {
                        quantity: stock.quantity
                    },
                    create: {
                        productId: stock.productId,
                        date: stockDate,
                        quantity: stock.quantity
                    }
                })
            )
        );

        res.json({
            message: `Daily stock initialized for ${stockDate.toISOString().split('T')[0]}`,
            created: results.length,
            source: fromPreviousDay ? 'previous_day' : 'main_stock'
        });
    } catch (err) {
        console.error('Error initializing daily stock:', err);
        res.status(500).json({ error: 'Failed to initialize daily stock' });
    }
});

