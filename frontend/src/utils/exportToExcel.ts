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
  memberId: number;
  firstName: string;
  lastName: string;
  memberName: string;
  type: 'FORFAIT' | 'ENTREE';
  period: string;
  paymentMode: string;
  price: number | null;
  comment: string | null;
  createdAt: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  durationMonths: number | null;
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

function durationMonthsValue(months: number | null | undefined): number | '' {
  return months === null || months === undefined ? '' : months;
}

function formatDateFr(value: string | null | undefined, withTime = false) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', withTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function subscriptionTypeLabel(durationMonths: number | null | undefined): string {
  if (durationMonths === null || durationMonths === undefined) return '';
  return durationMonths >= 999 ? 'Domiciliation' : `${durationMonths} mois`;
}

// ============================================
// FEUILLE : Membres
// ============================================
function buildMembersSheet(members: ExportMemberData[], payments: ExportPaymentData[]) {
  const paymentsByMember = new Map<number, ExportPaymentData[]>();
  payments.forEach(p => {
    if (!paymentsByMember.has(p.memberId)) paymentsByMember.set(p.memberId, []);
    paymentsByMember.get(p.memberId)!.push(p);
  });

  const rows = members.map(m => {
    const memberPayments = paymentsByMember.get(m.id) || [];
    const latestEntree = memberPayments
      .filter(p => p.type === 'ENTREE')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const latestForfait = memberPayments
      .filter(p => p.type === 'FORFAIT')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      'Nom': m.lastName || '',
      'Prénom': m.firstName || '',
      'Rôle': ROLE_LABELS[m.role] || m.role,
      'Solde': formatPrice(Number(m.balance)),
      'Fin abonnement': formatDateFr(m.subscriptionEndDate),
      "Type d'abonnement": subscriptionTypeLabel(latestEntree?.durationMonths),
      'Prix payé dernier abonnement': latestEntree?.price !== undefined && latestEntree?.price !== null ? formatPrice(latestEntree.price) : '',
      'Nb séances restantes': m.sessionCount ?? '',
      'Nb séances prises dernier achat': latestForfait ? (parseInt(latestForfait.period, 10) || 0) : '',
      'Prix payé dernier achat': latestForfait?.price !== undefined && latestForfait?.price !== null ? formatPrice(latestForfait.price) : '',
      'Date de naissance': formatDateFr(m.dateOfBirth),
      'Code postal': m.postalCode || '',
      'Sexe': m.gender ? (GENDER_LABELS[m.gender] || m.gender) : '',
      'GSM': m.phone || '',
      'Email': m.email || '',
      'Commentaire': m.notes || '',
      'Membre depuis': formatDateFr(m.createdAt),
    };
  });

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
    { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 18 },
    { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 28 }, { wch: 30 }, { wch: 16 },
  ];

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    [6, 9].forEach(c => {
      const cell = XLSX.utils.encode_cell({ r: R, c });
      if (sheet[cell] && typeof sheet[cell].v === 'number') {
        sheet[cell].z = '#,##0.00 "€"';
      }
    });
  }
  return sheet;
}

// ============================================
// FEUILLE : Historique des paiements
// ============================================
function buildSubscriptionsHistorySheet(payments: ExportPaymentData[]) {
  const rows = payments.map(p => ({
    'Nom': p.lastName || '',
    'Prénom': p.firstName || '',
    'Type': MEMBER_PAYMENT_TYPE_LABELS[p.type] || p.type,
    'Date début abonnement': p.type === 'ENTREE' ? formatDateFr(p.subscriptionStartDate) : '',
    'Date fin abonnement': p.type === 'ENTREE' ? formatDateFr(p.subscriptionEndDate) : '',
    'Durée abonnement': p.type === 'ENTREE' ? durationMonthsValue(p.durationMonths) : '',
    'Nb séances': p.type === 'FORFAIT' ? (parseInt(p.period, 10) || 0) : '',
    'Prix': p.price !== null ? formatPrice(p.price) : '',
    'Mode de paiement': PAYMENT_MODE_LABELS[p.paymentMode] || p.paymentMode,
    'Commentaire': p.comment || '',
    'Date de création': formatDateFr(p.createdAt),
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 16 },
  ];

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const cell = XLSX.utils.encode_cell({ r: R, c: 7 });
    if (sheet[cell] && typeof sheet[cell].v === 'number') {
      sheet[cell].z = '#,##0.00 "€"';
    }
  }
  return sheet;
}

export type ExportPresenceData = {
  id: number;
  memberId: number;
  firstName: string;
  lastName: string;
  arrivedAt: string;
};

// ============================================
// FEUILLE : Nombre de visites par jour
// ============================================
function buildVisitsCountSheet(presences: ExportPresenceData[]) {
  const countByDate = new Map<string, { label: string; date: Date; count: number }>();

  presences.forEach(p => {
    const d = new Date(p.arrivedAt);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const key = dayStart.toISOString();
    if (!countByDate.has(key)) {
      countByDate.set(key, { label: formatDateFr(p.arrivedAt), date: dayStart, count: 0 });
    }
    countByDate.get(key)!.count += 1;
  });

  const rows = Array.from(countByDate.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ label, count }) => ({
      'Date': label,
      'Nombre de visites': count,
    }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [{ wch: 16 }, { wch: 18 }];
  return sheet;
}

// ============================================
// FEUILLE : Historique des visites (détail par membre)
// ============================================
function buildVisitDetailSheet(presences: ExportPresenceData[], members: ExportMemberData[]) {
  const membersById = new Map(members.map(m => [m.id, m]));

  const rows = presences.map(p => {
    const member = membersById.get(p.memberId);
    return {
      'Nom': p.lastName || '',
      'Prénom': p.firstName || '',
      'Date fin abonnement': member ? formatDateFr(member.subscriptionEndDate) : '',
      'Séance restante': member?.sessionCount ?? '',
      'Date de venue': formatDateFr(p.arrivedAt, true),
    };
  });

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 18 }];
  return sheet;
}

function generateSubscriptionsWorkbook(
  payments: ExportPaymentData[],
  members: ExportMemberData[],
  presences: ExportPresenceData[],
  filename: string
) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildSubscriptionsHistorySheet(payments), 'Historique paiements');
  XLSX.utils.book_append_sheet(workbook, buildMembersSheet(members, payments), 'Membres');
  XLSX.utils.book_append_sheet(workbook, buildVisitsCountSheet(presences), 'Visites par jour');
  XLSX.utils.book_append_sheet(workbook, buildVisitDetailSheet(presences, members), 'Historique visites');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

async function fetchAllMembers(): Promise<ExportMemberData[]> {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Erreur lors de la récupération des membres');
  return response.json();
}

async function fetchAllPresences(): Promise<ExportPresenceData[]> {
  const response = await fetch('/api/daily-presences/export');
  if (!response.ok) throw new Error('Erreur lors de la récupération des visites');
  return response.json();
}

async function fetchPresencesFromDate(startDate: string): Promise<ExportPresenceData[]> {
  const response = await fetch(`/api/daily-presences/export/from/${startDate}`);
  if (!response.ok) throw new Error('Erreur lors de la récupération des visites');
  const result = await response.json();
  return result.data;
}

async function fetchPresencesRange(startDate: string, endDate: string): Promise<ExportPresenceData[]> {
  const response = await fetch(`/api/daily-presences/export/range?startDate=${startDate}&endDate=${endDate}`);
  if (!response.ok) throw new Error('Erreur lors de la récupération des visites');
  const result = await response.json();
  return result.data;
}

export async function exportAllPaymentsToExcel() {
  const [paymentsRes, members, presences] = await Promise.all([
    fetch('/api/payments/export'),
    fetchAllMembers(),
    fetchAllPresences(),
  ]);
  if (!paymentsRes.ok) throw new Error('Erreur lors de la récupération des paiements');
  const payments: ExportPaymentData[] = await paymentsRes.json();
  generateSubscriptionsWorkbook(payments, members, presences, 'tous-les-paiements');
}

export async function exportPaymentsFromDateToExcel(startDate: string) {
  const [paymentsRes, members, presences] = await Promise.all([
    fetch(`/api/payments/export/from/${startDate}`),
    fetchAllMembers(),
    fetchPresencesFromDate(startDate),
  ]);
  if (!paymentsRes.ok) throw new Error('Erreur lors de la récupération des paiements');
  const paymentsResult = await paymentsRes.json();
  generateSubscriptionsWorkbook(paymentsResult.data, members, presences, `paiements-depuis-${startDate}`);
}

export async function exportPaymentsRangeToExcel(startDate: string, endDate: string) {
  const [paymentsRes, members, presences] = await Promise.all([
    fetch(`/api/payments/export/range?startDate=${startDate}&endDate=${endDate}`),
    fetchAllMembers(),
    fetchPresencesRange(startDate, endDate),
  ]);
  if (!paymentsRes.ok) throw new Error('Erreur lors de la récupération des paiements');
  const paymentsResult = await paymentsRes.json();
  generateSubscriptionsWorkbook(paymentsResult.data, members, presences, `paiements-${startDate}-au-${endDate}`);
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