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