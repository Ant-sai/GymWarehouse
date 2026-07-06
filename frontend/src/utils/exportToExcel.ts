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
  dateOfBirth: string | null;
  postalCode: string | null;
  gender: 'HOMME' | 'FEMME' | null;
  notes: string | null;
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

    return order.products.map((product,index) => ({
      'Client': order.clientName,
      'Date': formattedDate,
      'Produit': product.name,
      'Quantité': product.quantity as string | number,
      'Prix unitaire': formatPrice(product.unitPrice) as string | number,
      'Prix total produit': formatPrice(product.totalPrice) as string | number,
      'Réduction': (index === 0 && order.discount > 0 ? -formatPrice(order.discount) : '') as string | number,
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
  const { data } = result;
  
  // Créer les lignes pour l'export
  const balanceRows = data.map(user => ({
    'Nom Prénom': user.fullName,
    'Date de naissance': user.dateOfBirth
      ? new Date(user.dateOfBirth).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '',
    'Code postal': user.postalCode || '',
    'Sexe': user.gender ? (GENDER_LABELS[user.gender] || user.gender) : '',
    'Balance': formatPrice(user.balance),
    'Nombre de commandes': user.totalOrders,
    'Commentaire': user.notes || '',
  }));

  const balanceSheet = XLSX.utils.json_to_sheet(balanceRows);

  // Largeur des colonnes
  balanceSheet['!cols'] = [
    { wch: 30 },  // Nom Prénom
    { wch: 18 },  // Date de naissance
    { wch: 14 },  // Code postal
    { wch: 10 },  // Sexe
    { wch: 15 },  // Balance
    { wch: 20 },  // Nombre de commandes
    { wch: 40 },  // Commentaire
  ];

  // Appliquer le format monétaire à la colonne Balance (colonne E - index 4)
  const balanceRange = XLSX.utils.decode_range(balanceSheet['!ref'] || 'A1');
  for (let R = balanceRange.s.r + 1; R <= balanceRange.e.r; ++R) {
    const cellE = XLSX.utils.encode_cell({ r: R, c: 4 });
    if (balanceSheet[cellE] && typeof balanceSheet[cellE].v === 'number') {
      balanceSheet[cellE].z = '#,##0.00 "€"';
    }
  }

  // Créer le classeur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, balanceSheet, 'Balances');

  // Télécharger le fichier
  const exportDate = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
  XLSX.writeFile(workbook, `balances-utilisateurs-${exportDate}.xlsx`);
}

// ============================================
// EXPORT DES PAIEMENTS (Forfaits & Abonnements)
// ============================================

export type ExportPaymentData = {
  id: number;
  firstName: string;
  lastName: string;
  memberName: string;
  type: 'FORFAIT' | 'ENTREE';
  period: string;
  paymentMode: string;
  price: number | null;
  comment: string | null;
  createdAt: string;
};

export type ExportMemberData = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  role: 'USER' | 'TRAINER';
  balance: number;
  subscriptionEndDate: string | null;
  sessionCount: number | null;
  dateOfBirth: string | null;
  postalCode: string | null;
  gender: 'HOMME' | 'FEMME' | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
};

export type ExportPresenceData = {
  id: number;
  firstName: string;
  lastName: string;
  arrivedAt: string;
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  CB: 'Carte bancaire',
  VIREMENT: 'Virement',
  QRCODE: 'QR Code',
};

const MEMBER_PAYMENT_TYPE_LABELS: Record<string, string> = {
  FORFAIT: 'Séances',
  ENTREE: 'Abonnement',
};

const GENDER_LABELS: Record<string, string> = {
  HOMME: 'Homme',
  FEMME: 'Femme',
};

const ROLE_LABELS: Record<string, string> = {
  USER: 'Utilisateur',
  TRAINER: 'Entraîneur',
};

function formatDateFr(value: string | null | undefined, withTime = false) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', withTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ============================================
// FEUILLE 1 : Membres
// ============================================
function buildMembersSheet(members: ExportMemberData[]) {
  const rows = members.map(m => ({
    'Nom': m.lastName || '',
    'Prénom': m.firstName || '',
    'Rôle': ROLE_LABELS[m.role] || m.role,
    'Solde': formatPrice(m.balance),
    'Fin abonnement': formatDateFr(m.subscriptionEndDate),
    'Nb séances': m.sessionCount ?? '',
    'Date de naissance': formatDateFr(m.dateOfBirth),
    'Code postal': m.postalCode || '',
    'Sexe': m.gender ? (GENDER_LABELS[m.gender] || m.gender) : '',
    'GSM': m.phone || '',
    'Email': m.email || '',
    'Commentaire': m.notes || '',
    'Membre depuis': formatDateFr(m.createdAt),
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
    { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 28 }, { wch: 30 }, { wch: 16 },
  ];
  return sheet;
}

// ============================================
// FEUILLE 2 : Forfaits & Abonnements (séances/subscriptions)
// ============================================
function buildSubscriptionsSheet(payments: ExportPaymentData[]) {
  const rows = payments.map(p => ({
    'Nom': p.lastName || '',
    'Prénom': p.firstName || '',
    'Type': MEMBER_PAYMENT_TYPE_LABELS[p.type] || p.type,
    'Date de début': formatDateFr(p.createdAt),
    'Date de fin': '',
    'Durée d\'abonnement': '',
    'Date de création': formatDateFr(p.createdAt),
    'Durée / Détail': p.period,
    'Montant': p.price !== null ? formatPrice(p.price) : '',
    'Mode de paiement': PAYMENT_MODE_LABELS[p.paymentMode] || p.paymentMode,
    'Commentaire': p.comment || '',
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 30 },
  ];

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const cell = XLSX.utils.encode_cell({ r: R, c: 8 });
    if (sheet[cell] && typeof sheet[cell].v === 'number') {
      sheet[cell].z = '#,##0.00 "€"';
    }
  }
  return sheet;
}

// ============================================
// FEUILLE 3 : Visites
// ============================================
function buildVisitsSheet(presences: ExportPresenceData[]) {
  const rows = presences.map(p => ({
    'Nom': p.lastName || '',
    'Prénom': p.firstName || '',
    'Date de visite': formatDateFr(p.arrivedAt, true),
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 20 }];
  return sheet;
}

// ============================================
// FEUILLE 4 : Fréquentation journalière (agrégat des visites)
// ============================================
function buildDailyAttendanceSheet(presences: ExportPresenceData[]) {
  const countByDay = new Map<string, number>();
  presences.forEach(p => {
    const day = new Date(p.arrivedAt).toISOString().split('T')[0];
    countByDay.set(day, (countByDay.get(day) || 0) + 1);
  });

  const sortedDays = Array.from(countByDay.keys()).sort();
  const rows = sortedDays.map(day => ({
    'Date': new Date(day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    'Nombre de visites': countByDay.get(day) || 0,
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [{ wch: 14 }, { wch: 18 }];
  return sheet;
}

function generateSubscriptionsWorkbook(
  payments: ExportPaymentData[],
  members: ExportMemberData[],
  presences: ExportPresenceData[],
  filename: string
) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildMembersSheet(members), 'Members');
  XLSX.utils.book_append_sheet(workbook, buildSubscriptionsSheet(payments), 'Subscriptions & Sessions');
  XLSX.utils.book_append_sheet(workbook, buildVisitsSheet(presences), 'Visits');
  XLSX.utils.book_append_sheet(workbook, buildDailyAttendanceSheet(presences), 'Daily Attendance');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

async function fetchAllMembers(): Promise<ExportMemberData[]> {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Erreur lors de la récupération des membres');
  return response.json();
}

export async function exportAllPaymentsToExcel() {
  const [paymentsRes, presencesRes, members] = await Promise.all([
    fetch('/api/payments/export'),
    fetch('/api/daily-presences/export'),
    fetchAllMembers(),
  ]);
  if (!paymentsRes.ok) throw new Error('Erreur lors de la récupération des paiements');
  if (!presencesRes.ok) throw new Error('Erreur lors de la récupération des visites');
  const payments: ExportPaymentData[] = await paymentsRes.json();
  const presences: ExportPresenceData[] = await presencesRes.json();
  generateSubscriptionsWorkbook(payments, members, presences, 'tous-les-paiements');
}

export async function exportPaymentsFromDateToExcel(startDate: string) {
  const [paymentsRes, presencesRes, members] = await Promise.all([
    fetch(`/api/payments/export/from/${startDate}`),
    fetch(`/api/daily-presences/export/from/${startDate}`),
    fetchAllMembers(),
  ]);
  if (!paymentsRes.ok) throw new Error('Erreur lors de la récupération des paiements');
  if (!presencesRes.ok) throw new Error('Erreur lors de la récupération des visites');
  const paymentsResult = await paymentsRes.json();
  const presencesResult = await presencesRes.json();
  generateSubscriptionsWorkbook(paymentsResult.data, members, presencesResult.data, `paiements-depuis-${startDate}`);
}

export async function exportPaymentsRangeToExcel(startDate: string, endDate: string) {
  const [paymentsRes, presencesRes, members] = await Promise.all([
    fetch(`/api/payments/export/range?startDate=${startDate}&endDate=${endDate}`),
    fetch(`/api/daily-presences/export/range?startDate=${startDate}&endDate=${endDate}`),
    fetchAllMembers(),
  ]);
  if (!paymentsRes.ok) throw new Error('Erreur lors de la récupération des paiements');
  if (!presencesRes.ok) throw new Error('Erreur lors de la récupération des visites');
  const paymentsResult = await paymentsRes.json();
  const presencesResult = await presencesRes.json();
  generateSubscriptionsWorkbook(paymentsResult.data, members, presencesResult.data, `paiements-${startDate}-au-${endDate}`);
}

// ============================================
// EXPORT DU STOCK (Ajouts de stock)
// ============================================
export type ExportStockAdditionData = {
  date: string;
  productName: string;
  quantity: number;
  trainerPrice: number;
};

type ProductData = {
  id: number;
  name: string;
  quantity: number;
  trainerPrice: number;
};

export async function exportStockToExcel() {
  try {
    const [additionsRes, productsRes] = await Promise.all([
      fetch('/api/stock-additions/export'),
      fetch('/api/products')
    ]);

    if (!additionsRes.ok) throw new Error('Erreur lors de la récupération des ajouts de stock');
    if (!productsRes.ok) throw new Error('Erreur lors de la récupération des produits');

    const additions: ExportStockAdditionData[] = await additionsRes.json();
    const products: ProductData[] = await productsRes.json();
    generateStockExcelFile(additions, products);
  } catch (error) {
    console.error('Erreur export stock:', error);
    throw error;
  }
}

function generateStockExcelFile(data: ExportStockAdditionData[], products: ProductData[]) {
  // ============================================
  // FEUILLE 1 : Historique des ajouts par date
  // ============================================

  // Grouper les données par produit et date
  const productMap = new Map<string, Map<string, number>>();
  const allDates = new Set<string>();

  data.forEach(addition => {
    const formattedDate = new Date(addition.date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    allDates.add(formattedDate);

    if (!productMap.has(addition.productName)) {
      productMap.set(addition.productName, new Map());
    }

    const dateMap = productMap.get(addition.productName)!;
    const currentQty = dateMap.get(formattedDate) || 0;
    dateMap.set(formattedDate, currentQty + addition.quantity);
  });

  // Trier les dates chronologiquement
  const sortedDates = Array.from(allDates).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
  });

  // Créer les lignes pour la feuille 1
  const historyRows = Array.from(productMap.entries()).map(([productName, dateMap]) => {
    const row: Record<string, string | number> = { 'Produit': productName };

    sortedDates.forEach(date => {
      row[date] = dateMap.get(date) || 0;
    });

    return row;
  });

  const historySheet = XLSX.utils.json_to_sheet(historyRows);

  // Largeur des colonnes pour la feuille 1
  const colWidths = [{ wch: 30 }];
  sortedDates.forEach(() => colWidths.push({ wch: 15 }));
  historySheet['!cols'] = colWidths;

  // ============================================
  // FEUILLE 2 : Stock actuel et valeur
  // ============================================

  const valueRows = products.map(product => ({
    'Produit': product.name,
    'Stock Actuel': product.quantity,
    'Prix Entraîneur': formatPrice(Number(product.trainerPrice)),
    'Valeur Stock': formatPrice(product.quantity * Number(product.trainerPrice))
  }));

  const valueSheet = XLSX.utils.json_to_sheet(valueRows);

  valueSheet['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
  ];

  // Formater les prix (colonnes C et D)
  const range = XLSX.utils.decode_range(valueSheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const cellC = XLSX.utils.encode_cell({ r: R, c: 2 });
    if (valueSheet[cellC] && typeof valueSheet[cellC].v === 'number') {
      valueSheet[cellC].z = '#,##0.00 "€"';
    }
    const cellD = XLSX.utils.encode_cell({ r: R, c: 3 });
    if (valueSheet[cellD] && typeof valueSheet[cellD].v === 'number') {
      valueSheet[cellD].z = '#,##0.00 "€"';
    }
  }

  // ============================================
  // Créer le classeur avec les deux feuilles
  // ============================================
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, historySheet, 'Historique Ajouts');
  XLSX.utils.book_append_sheet(workbook, valueSheet, 'Stock et Valeur');

  const filenameDate = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
  XLSX.writeFile(workbook, `stock-${filenameDate}.xlsx`);
}