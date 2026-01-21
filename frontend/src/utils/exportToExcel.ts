import * as XLSX from 'xlsx';

export type ExportOrderData = {
  orderId: number;
  clientName: string;
  date: string;
  products: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
  discount: number;
  notes?: string | null;
};

export type ExportBalanceData = {
  userId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  balance: number;
  totalOrders: number;
  memberSince: string;
  status: string;
};

type BalanceExportResponse = {
  exportDate: string;
  statistics: {
    totalUsers: number;
    totalTrainers: number;
    totalRegularUsers: number;
    totalBalance: number;
    totalDebt: number;
    totalCredit: number;
    usersInDebt: number;
    usersWithCredit: number;
  };
  data: ExportBalanceData[];
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  QRCODE: 'QR Code',
  ACCOUNT_DEBIT: 'Crédit',
  FREE: 'Gratuit',
  CREDITCARD: 'Carte bancaire',
  PAYPAL: 'PayPal'
};

const ROLE_LABELS: Record<string, string> = {
  TRAINER: 'Entraîneur',
  USER: 'Utilisateur'
};

const STATUS_LABELS: Record<string, string> = {
  DETTE: '❌ Dette',
  CRÉDIT: '✅ Crédit',
  ÉQUILIBRÉ: '➖ Équilibré'
};

// Fonction helper pour formater les nombres avec des virgules (pour affichage Excel)
function formatPrice(price: number): number {
  return parseFloat(price.toFixed(2));
}

// ============================================
// EXPORT DES COMMANDES
// ============================================

export async function exportAllOrdersToExcel() {
  try {
    const response = await fetch('/api/orders/export');
    if (!response.ok) throw new Error('Erreur lors de la récupération des données');
    
    const data: ExportOrderData[] = await response.json();
    generateExcelFile(data, 'toutes-les-commandes');
  } catch (error) {
    console.error('Erreur export:', error);
    throw error;
  }
}

export async function exportOrdersFromDateToExcel(startDate: string) {
  try {
    const response = await fetch(`/api/orders/export/from/${startDate}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des données');
    
    const result = await response.json();
    const data: ExportOrderData[] = result.data;
    generateExcelFile(data, `commandes-depuis-${startDate}`);
  } catch (error) {
    console.error('Erreur export:', error);
    throw error;
  }
}

export async function exportOrdersRangeToExcel(startDate: string, endDate: string) {
  try {
    const response = await fetch(`/api/orders/export/range?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des données');
    
    const result = await response.json();
    const data: ExportOrderData[] = result.data;
    generateExcelFile(data, `commandes-${startDate}-au-${endDate}`);
  } catch (error) {
    console.error('Erreur export:', error);
    throw error;
  }
}

function generateExcelFile(data: ExportOrderData[], filename: string) {
  // Transformer les données pour l'export
  const rows = data.flatMap(order => {
    const formattedDate = new Date(order.date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Si la commande a plusieurs produits, créer une ligne par produit
    if (order.products.length === 0) {
      return [{
        'Client': order.clientName,
        'Date': formattedDate,
        'Produit': '',
        'Quantité': '' as string | number,
        'Prix unitaire': '' as string | number,
        'Prix total produit': '' as string | number,
        'Réduction': order.discount > 0 ? -formatPrice(order.discount) : '' as string | number,
        'Montant total': formatPrice(order.totalAmount),
        'Moyen de paiement': PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod,
        'Notes': order.notes || ''
      }];
    }

    return order.products.map((product) => ({
      'Client': order.clientName,
      'Date': formattedDate,
      'Produit': product.name,
      'Quantité': product.quantity as string | number,
      'Prix unitaire': formatPrice(product.unitPrice) as string | number,
      'Prix total produit': formatPrice(product.totalPrice) as string | number,
      'Réduction': (order.discount > 0 ? -formatPrice(order.discount) : '') as string | number,
      'Montant total': formatPrice(order.totalAmount),
      'Moyen de paiement': PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod,
      'Notes': order.notes || ''
    }));
  });

  // Créer une feuille de calcul
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Définir la largeur des colonnes
  const columnWidths = [
    { wch: 25 },  // Client
    { wch: 18 },  // Date
    { wch: 30 },  // Produit
    { wch: 10 },  // Quantité
    { wch: 15 },  // Prix unitaire
    { wch: 18 },  // Prix total produit
    { wch: 12 },  // Réduction
    { wch: 15 },  // Montant total
    { wch: 18 },  // Moyen de paiement
    { wch: 40 },  // Notes
  ];
  worksheet['!cols'] = columnWidths;

  // Appliquer le format monétaire avec virgule aux colonnes de prix
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    // Prix unitaire (colonne E - index 4)
    const cellE = XLSX.utils.encode_cell({ r: R, c: 4 });
    if (worksheet[cellE] && typeof worksheet[cellE].v === 'number') {
      worksheet[cellE].z = '#,##0.00 "€"';
    }
    
    // Prix total produit (colonne F - index 5)
    const cellF = XLSX.utils.encode_cell({ r: R, c: 5 });
    if (worksheet[cellF] && typeof worksheet[cellF].v === 'number') {
      worksheet[cellF].z = '#,##0.00 "€"';
    }
    
    // Réduction (colonne G - index 6)
    const cellG = XLSX.utils.encode_cell({ r: R, c: 6 });
    if (worksheet[cellG] && typeof worksheet[cellG].v === 'number') {
      worksheet[cellG].z = '#,##0.00 "€"';
    }
    
    // Montant total (colonne H - index 7)
    const cellH = XLSX.utils.encode_cell({ r: R, c: 7 });
    if (worksheet[cellH] && typeof worksheet[cellH].v === 'number') {
      worksheet[cellH].z = '#,##0.00 "€"';
    }
  }

  // Créer un classeur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Commandes');

  // Télécharger le fichier
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ============================================
// EXPORT DES BALANCES UTILISATEURS
// ============================================

export async function exportUserBalancesToExcel() {
  try {
    const response = await fetch('/api/users/export/balances');
    if (!response.ok) throw new Error('Erreur lors de la récupération des données');
    
    const result: BalanceExportResponse = await response.json();
    generateBalancesExcelFile(result);
  } catch (error) {
    console.error('Erreur export balances:', error);
    throw error;
  }
}

function generateBalancesExcelFile(result: BalanceExportResponse) {
  const { data, statistics } = result;
  
  // Feuille 1: Balances des utilisateurs
  const balanceRows = data.map(user => ({
    'ID': user.userId,
    'Prénom': user.firstName,
    'Nom': user.lastName,
    'Nom complet': user.fullName,
    'Rôle': ROLE_LABELS[user.role] || user.role,
    'Balance': formatPrice(user.balance),
    'Statut': STATUS_LABELS[user.status] || user.status,
    'Nombre de commandes': user.totalOrders,
    'Membre depuis': new Date(user.memberSince).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }));

  const balanceSheet = XLSX.utils.json_to_sheet(balanceRows);

  // Largeur des colonnes
  balanceSheet['!cols'] = [
    { wch: 8 },   // ID
    { wch: 15 },  // Prénom
    { wch: 15 },  // Nom
    { wch: 25 },  // Nom complet
    { wch: 15 },  // Rôle
    { wch: 15 },  // Balance
    { wch: 15 },  // Statut
    { wch: 20 },  // Nombre de commandes
    { wch: 18 },  // Membre depuis
  ];

  // Appliquer le format monétaire à la colonne Balance (colonne F - index 5)
  const balanceRange = XLSX.utils.decode_range(balanceSheet['!ref'] || 'A1');
  for (let R = balanceRange.s.r + 1; R <= balanceRange.e.r; ++R) {
    const cellF = XLSX.utils.encode_cell({ r: R, c: 5 });
    if (balanceSheet[cellF] && typeof balanceSheet[cellF].v === 'number') {
      balanceSheet[cellF].z = '#,##0.00 "€"';
    }
  }

  // Feuille 2: Statistiques globales
  const statsRows = [
    { 'Statistique': 'Nombre total d\'utilisateurs', 'Valeur': statistics.totalUsers },
    { 'Statistique': 'Nombre d\'entraîneurs', 'Valeur': statistics.totalTrainers },
    { 'Statistique': 'Nombre d\'utilisateurs réguliers', 'Valeur': statistics.totalRegularUsers },
    { 'Statistique': '', 'Valeur': '' },
    { 'Statistique': 'Balance totale', 'Valeur': formatPrice(statistics.totalBalance) },
    { 'Statistique': 'Total des dettes', 'Valeur': formatPrice(statistics.totalDebt) },
    { 'Statistique': 'Total des crédits', 'Valeur': formatPrice(statistics.totalCredit) },
    { 'Statistique': '', 'Valeur': '' },
    { 'Statistique': 'Utilisateurs en dette', 'Valeur': statistics.usersInDebt },
    { 'Statistique': 'Utilisateurs avec crédit', 'Valeur': statistics.usersWithCredit },
  ];

  const statsSheet = XLSX.utils.json_to_sheet(statsRows);

  // Largeur des colonnes pour les stats
  statsSheet['!cols'] = [
    { wch: 35 },  // Statistique
    { wch: 20 },  // Valeur
  ];

  // Appliquer le format monétaire aux lignes de balance
  const statsRange = XLSX.utils.decode_range(statsSheet['!ref'] || 'A1');
  for (let R = statsRange.s.r + 1; R <= statsRange.e.r; ++R) {
    const cellB = XLSX.utils.encode_cell({ r: R, c: 1 });
    if (statsSheet[cellB] && typeof statsSheet[cellB].v === 'number') {
      // Vérifier si c'est une ligne avec un montant en euros
      const cellA = XLSX.utils.encode_cell({ r: R, c: 0 });
      const label = statsSheet[cellA]?.v;
      if (typeof label === 'string' && (label.includes('Balance') || label.includes('dette') || label.includes('crédit'))) {
        statsSheet[cellB].z = '#,##0.00 "€"';
      }
    }
  }

  // Feuille 3: Top 10 des dettes
  const debtsData = data
    .filter(u => u.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 10)
    .map((user, index) => ({
      'Rang': index + 1,
      'Nom complet': user.fullName,
      'Rôle': ROLE_LABELS[user.role] || user.role,
      'Dette': formatPrice(Math.abs(user.balance)),
    }));

  const debtsSheet = XLSX.utils.json_to_sheet(
    debtsData.length > 0 
      ? debtsData 
      : [{ 'Rang': '', 'Nom complet': 'Aucune dette', 'Rôle': '', 'Dette': '' }]
  );

  debtsSheet['!cols'] = [
    { wch: 8 },   // Rang
    { wch: 25 },  // Nom complet
    { wch: 15 },  // Rôle
    { wch: 15 },  // Dette
  ];

  // Format monétaire pour la colonne Dette
  if (debtsData.length > 0) {
    const debtsRange = XLSX.utils.decode_range(debtsSheet['!ref'] || 'A1');
    for (let R = debtsRange.s.r + 1; R <= debtsRange.e.r; ++R) {
      const cellD = XLSX.utils.encode_cell({ r: R, c: 3 });
      if (debtsSheet[cellD] && typeof debtsSheet[cellD].v === 'number') {
        debtsSheet[cellD].z = '#,##0.00 "€"';
      }
    }
  }

  // Feuille 4: Top 10 des crédits
  const creditsData = data
    .filter(u => u.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10)
    .map((user, index) => ({
      'Rang': index + 1,
      'Nom complet': user.fullName,
      'Rôle': ROLE_LABELS[user.role] || user.role,
      'Crédit': formatPrice(user.balance),
    }));

  const creditsSheet = XLSX.utils.json_to_sheet(
    creditsData.length > 0 
      ? creditsData 
      : [{ 'Rang': '', 'Nom complet': 'Aucun crédit', 'Rôle': '', 'Crédit': '' }]
  );

  creditsSheet['!cols'] = [
    { wch: 8 },   // Rang
    { wch: 25 },  // Nom complet
    { wch: 15 },  // Rôle
    { wch: 15 },  // Crédit
  ];

  // Format monétaire pour la colonne Crédit
  if (creditsData.length > 0) {
    const creditsRange = XLSX.utils.decode_range(creditsSheet['!ref'] || 'A1');
    for (let R = creditsRange.s.r + 1; R <= creditsRange.e.r; ++R) {
      const cellD = XLSX.utils.encode_cell({ r: R, c: 3 });
      if (creditsSheet[cellD] && typeof creditsSheet[cellD].v === 'number') {
        creditsSheet[cellD].z = '#,##0.00 "€"';
      }
    }
  }

  // Créer le classeur avec toutes les feuilles
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, balanceSheet, 'Balances');
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');
  XLSX.utils.book_append_sheet(workbook, debtsSheet, 'Top 10 Dettes');
  XLSX.utils.book_append_sheet(workbook, creditsSheet, 'Top 10 Crédits');

  // Télécharger le fichier
  const exportDate = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
  XLSX.writeFile(workbook, `balances-utilisateurs-${exportDate}.xlsx`);
}