export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'business' | 'restaurante' | 'supplier' | 'customer' | 'fornecedor' | 'cliente' | 'superadmin';
  businessId?: string;
  restaurantId?: string; // Legacy support
  supplierId?: string;
  companyName: string;
  businessProfile?: {
    type: 'food_service' | 'retail' | 'atacado';
    subCategory: string;
  };
  supplierProfile?: {
    type: string;
    subCategory: string;
  };
  activeExtensions?: string[];
  logoUrl?: string;
  profile?: {
    addresses(addresses: any): unknown;
    whatsapp?: string;
    logoUrl?: string;
  };
  status: 'active' | 'suspended';
  subscription?: {
    planId: string;
    // planId: 'free' | 'pro_1pc' | 'ultra_network';
    status: 'active' | 'trialing' | 'overdue' | 'canceled';
    startedAt: any; // Firebase Timestamp
    nextBillingAt?: any; // Firebase Timestamp
    trialEndsAt?: any; // Firebase Timestamp
    //nextBillingAt?: Date;
    monthlyOrders: {
      count: number;
      month: string; // Formato 'YYYY-MM'
    };
  }
  // --- NOVOS CAMPOS ADICIONADOS ---
  isAffiliate?: boolean;
  affiliateBalance?: number;
  impulsionadorScore?: any;
  wantsToParticipateInDraws?: boolean; // Para o "Show do Comilhão"
  lotteryCode?: string; // Para o "Show do Comilhão"
}


export interface CartItem {
  id: string;
  name: string;
  salePrice: number;
  qty: number;
  barcode?: string;
  sku?: string;
}

export interface AddonItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imagePath?: string;
  isAvailable: boolean;
}

export interface AddonGroup {
  id: string;
  name: string;
  type: 'ingredient' | 'specification' | 'cross-sell' | 'disposable';
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  items: AddonItem[];
}

export interface Product {
  id: string;
  name: string;
  // This is the correct field name based on your ProductsManager
  category: string; 
  subcategoryId?: string;
  productStructure: 'simples' | 'producao' | 'grade';
  salePrice: number;
  costPrice: number;
  stockQuantity: number;
  imageUrl?: string;
  imagePath: string;
  taxRate: number; // Em porcentagem, ex: 17 para 17%
  unit?: string; // Ex: kg, g, l, ml, un, pct
  weightInGrams?: number; 
  volumeInMilliliters?: number; 
  dimensions?: {
    length: number; 
    width: number; 
    height: number;
  };
  displayInCatalog: boolean;
  showInCatalog: boolean;
  allowCombination: boolean;
  recipe?: RecipeItem[];
  variants?: ProductVariant[];
  businessId: string;
  barcode?: string;
  sku?: string;
  description?: string;
  addonGroups?: AddonGroup[];
  addonGroupIds?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ncm?: string;
  cest?: string;
  gtin?: string;
  origin?: string;
  // For products with variants, this represents the total stock across all variants
  totalVariantStock?: number;
  // For products with variants, this represents the minimum stock level across all variants
  minVariantStock?: number;
  // For products with variants, this represents the maximum stock level across all variants
  maxVariantStock?: number;
  // For products with variants, this represents the average sale price across all variants
  avgVariantSalePrice?: number;
  // For products with variants, this represents the average cost price across all variants
  avgVariantCostPrice?: number;
  // For products with variants, this represents the total number of variants
  variantCount?: number;
  // For products with variants, this represents the number of variants that are out of stock
  outOfStockVariantCount?: number;
  // For products with variants, this represents the number of variants that are low in stock (below a certain threshold)
  lowStockVariantCount?: number;
  // For products with variants, this represents the number of variants that are in stock (above a certain threshold)
  inStockVariantCount?: number;
  // For products with variants, this represents the total stock value (costPrice * stockQuantity) across all variants
  totalVariantStockValue?: number;
  // For products with variants, this represents the total potential sales value (salePrice * stockQuantity) across all variants
  totalVariantSalesValue?: number;
  // For products with variants, this represents the total potential profit value ((salePrice - costPrice) * stockQuantity) across all variants
  totalVariantProfitValue?: number;
  // For products with variants, this represents the average profit margin percentage across all variants
  avgVariantProfitMargin?: number;
  // For products with variants, this represents the highest sale price among all variants
  maxVariantSalePrice?: number;
  // For products with variants, this represents the lowest sale price among all variants
  minVariantSalePrice?: number;
  // For products with variants, this represents the highest cost price among all variants
  maxVariantCostPrice?: number;
  // For products with variants, this represents the lowest cost price among all variants
  minVariantCostPrice?: number;
  // For products with variants, this represents the date when the product was last sold
  lastSoldAt?: Date;
  // For products with variants, this represents the total quantity sold across all variants
  totalVariantQuantitySold?: number;
  // For products with variants, this represents the total revenue generated from sales across all variants
  totalVariantRevenue?: number;
  // For products with variants, this represents the total profit generated from sales across all variants
  totalVariantProfit?: number;
  // For products with variants, this represents the average sale price of sold items across all variants
  avgVariantSoldPrice?: number;
  // For products with variants, this represents the average cost price of sold items across all variants
  avgVariantSoldCost?: number;
  // For products with variants, this represents the average profit margin percentage of sold items across all variants
  avgVariantSoldProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been sold
  totalVariantSalesCount?: number;
  // For products with variants, this represents the average number of items sold per sale across all variants
  avgItemsPerVariantSale?: number;
  // For products with variants, this represents the number of days since the product was last sold
  daysSinceLastVariantSale?: number;
  // For products with variants, this represents the average number of days between sales across all variants
  avgDaysBetweenVariantSales?: number;
  // For products with variants, this represents the total number of unique customers who have purchased variants
  uniqueVariantCustomers?: number;
  // For products with variants, this represents the total number of returns across all variants
  totalVariantReturns?: number;
  // For products with variants, this represents the total quantity returned across all variants
  totalVariantQuantityReturned?: number;
  // For products with variants, this represents the total revenue lost due to returns across all variants
  totalVariantReturnRevenueLoss?: number;
  // For products with variants, this represents the average time (in days) it takes to sell out of stock across all variants
  avgDaysToSellOutOfStockVariants?: number;
  // For products with variants, this represents the average customer rating across all variants
  avgVariantCustomerRating?: number;
  // For products with variants, this represents the total number of reviews across all variants
  totalVariantReviews?: number;
  // For products with variants, this represents the average number of reviews per sale across all variants
  avgReviewsPerVariantSale?: number;
  // For products with variants, this represents the total number of times variants have been added to carts
  totalVariantAddToCarts?: number;
  // For products with variants, this represents the average number of times variants have been added to carts per sale
  avgVariantAddToCartsPerSale?: number;
  // For products with variants, this represents the conversion rate (sales / add to carts) across all variants
  variantConversionRate?: number;
  // For products with variants, this represents the total number of times variants have been wishlisted
  totalVariantWishlists?: number;
  // For products with variants, this represents the average number of times variants have been wishlisted per sale
  avgVariantWishlistsPerSale?: number;
  // For products with variants, this represents the total number of times variants have been shared
  totalVariantShares?: number;
  // For products with variants, this represents the average number of times variants have been shared per sale
  avgVariantSharesPerSale?: number;
  // For products with variants, this represents the total number of views across all variants
  totalVariantViews?: number;
  // For products with variants, this represents the average number of views per sale across all variants
  avgVariantViewsPerSale?: number;
  // For products with variants, this represents the view-to-sale conversion rate across all variants
  variantViewToSaleConversionRate?: number;
  // For products with variants, this represents the total number of times variants have been compared
  totalVariantCompares?: number;
  // For products with variants, this represents the average number of times variants have been compared per sale
  avgVariantComparesPerSale?: number;
  // For products with variants, this represents the total number of times variants have been refunded
  totalVariantRefunds?: number;
  // For products with variants, this represents the total quantity refunded across all variants
  totalVariantQuantityRefunded?: number;
  // For products with variants, this represents the total revenue lost due to refunds across all variants
  totalVariantRefundRevenueLoss?: number;
  // For products with variants, this represents the average time (in days) it takes to process a refund across all variants
  avgDaysToProcessVariantRefunds?: number;
  // For products with variants, this represents the total number of times variants have been exchanged
  totalVariantExchanges?: number;
  // For products with variants, this represents the total quantity exchanged across all variants
  totalVariantQuantityExchanged?: number;
  // For products with variants, this represents the total revenue lost due to exchanges across all variants
  totalVariantExchangeRevenueLoss?: number;
  // For products with variants, this represents the average time (in days) it takes to process an exchange across all variants
  avgDaysToProcessVariantExchanges?: number;
  // For products with variants, this represents the total number of times variants have been backordered
  totalVariantBackorders?: number;
  // For products with variants, this represents the average time (in days) it takes to fulfill a backorder across all variants
  avgDaysToFulfillVariantBackorders?: number;
  // For products with variants, this represents the total number of times variants have been pre-ordered
  totalVariantPreorders?: number;
  // For products with variants, this represents the average time (in days) it takes to fulfill a pre-order across all variants
  avgDaysToFulfillVariantPreorders?: number;
  // For products with variants, this represents the total number of times variants have been featured in promotions
  totalVariantPromotions?: number;
  // For products with variants, this represents the average discount percentage applied during promotions across all variants
  avgVariantPromotionDiscount?: number;
  // For products with variants, this represents the total revenue generated from promotions across all variants
  totalVariantPromotionRevenue?: number;
  // For products with variants, this represents the total profit generated from promotions across all variants
  totalVariantPromotionProfit?: number;
  // For products with variants, this represents the average profit margin percentage during promotions across all variants
  avgVariantPromotionProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in marketing campaigns
  totalVariantMarketingCampaigns?: number;
  // For products with variants, this represents the average ROI (return on investment) from marketing campaigns across all variants
  avgVariantMarketingROI?: number;
  // For products with variants, this represents the total revenue generated from marketing campaigns across all variants
  totalVariantMarketingRevenue?: number;
  // For products with variants, this represents the total profit generated from marketing campaigns across all variants
  totalVariantMarketingProfit?: number;
  // For products with variants, this represents the average profit margin percentage from marketing campaigns across all variants
  avgVariantMarketingProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in email campaigns
  totalVariantEmailCampaigns?: number;
  // For products with variants, this represents the average open rate of email campaigns across all variants
  avgVariantEmailOpenRate?: number;
  // For products with variants, this represents the average click-through rate of email campaigns across all variants
  avgVariantEmailClickThroughRate?: number;
  // For products with variants, this represents the total revenue generated from email campaigns across all variants
  totalVariantEmailRevenue?: number;
  // For products with variants, this represents the total profit generated from email campaigns across all variants
  totalVariantEmailProfit?: number;
  // For products with variants, this represents the average profit margin percentage from email campaigns across all variants
  avgVariantEmailProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in social media campaigns
  totalVariantSocialMediaCampaigns?: number;
  // For products with variants, this represents the average engagement rate on social media campaigns across all variants
  avgVariantSocialMediaEngagementRate?: number;
  // For products with variants, this represents the total revenue generated from social media campaigns across all variants
  totalVariantSocialMediaRevenue?: number;
  // For products with variants, this represents the total profit generated from social media campaigns across all variants
  totalVariantSocialMediaProfit?: number;
  // For products with variants, this represents the average profit margin percentage from social media campaigns across all variants
  avgVariantSocialMediaProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in influencer campaigns
  totalVariantInfluencerCampaigns?: number;
  // For products with variants, this represents the average ROI (return on investment) from influencer campaigns across all variants
  avgVariantInfluencerROI?: number;
  // For products with variants, this represents the total revenue generated from influencer campaigns across all variants
  totalVariantInfluencerRevenue?: number;
  // For products with variants, this represents the total profit generated from influencer campaigns across all variants
  totalVariantInfluencerProfit?: number;
  // For products with variants, this represents the average profit margin percentage from influencer campaigns across all variants
  avgVariantInfluencerProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in flash sales
  totalVariantFlashSales?: number;
  // For products with variants, this represents the average discount percentage applied during flash sales across all variants
  avgVariantFlashSaleDiscount?: number;
  // For products with variants, this represents the total revenue generated from flash sales across all variants
  totalVariantFlashSaleRevenue?: number;
  // For products with variants, this represents the total profit generated from flash sales across all variants
  totalVariantFlashSaleProfit?: number;
  // For products with variants, this represents the average profit margin percentage during flash sales across all variants
  avgVariantFlashSaleProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in seasonal sales
  totalVariantSeasonalSales?: number;
  // For products with variants, this represents the average discount percentage applied during seasonal sales across all variants
  avgVariantSeasonalSaleDiscount?: number;
  // For products with variants, this represents the total revenue generated from seasonal sales across all variants
  totalVariantSeasonalSaleRevenue?: number;
  // For products with variants, this represents the total profit generated from seasonal sales across all variants
  totalVariantSeasonalSaleProfit?: number;
  // For products with variants, this represents the average profit margin percentage during seasonal sales across all variants
  avgVariantSeasonalSaleProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in clearance sales
  totalVariantClearanceSales?: number;
  // For products with variants, this represents the average discount percentage applied during clearance sales across all variants
  avgVariantClearanceSaleDiscount?: number;
  // For products with variants, this represents the total revenue generated from clearance sales across all variants
  totalVariantClearanceSaleRevenue?: number;
  // For products with variants, this represents the total profit generated from clearance sales across all variants
  totalVariantClearanceSaleProfit?: number;
  // For products with variants, this represents the average profit margin percentage during clearance sales across all variants
  avgVariantClearanceSaleProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in bundle deals
  totalVariantBundleDeals?: number;
  // For products with variants, this represents the average discount percentage applied during bundle deals across all variants
  avgVariantBundleDealDiscount?: number;
  // For products with variants, this represents the total revenue generated from bundle deals across all variants
  totalVariantBundleDealRevenue?: number;
  // For products with variants, this represents the total profit generated from bundle deals across all variants
  totalVariantBundleDealProfit?: number;
  // For products with variants, this represents the average profit margin percentage during bundle deals across all variants
  avgVariantBundleDealProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in loyalty programs
  totalVariantLoyaltyPrograms?: number;
  // For products with variants, this represents the average points earned per purchase across all variants
  avgVariantLoyaltyPointsPerPurchase?: number;
  // For products with variants, this represents the total revenue generated from loyalty program purchases across all variants
  totalVariantLoyaltyProgramRevenue?: number;
  // For products with variants, this represents the total profit generated from loyalty program purchases across all variants
  totalVariantLoyaltyProgramProfit?: number;
  // For products with variants, this represents the average profit margin percentage from loyalty program purchases across all variants
  avgVariantLoyaltyProgramProfitMargin?: number;
  // For products with variants, this represents the total number of times variants have been featured in referral programs
  totalVariantReferralPrograms?: number;
    // For products with variants, this represents the average discount percentage applied during referral program purchases across all variants
    avgVariantReferralProgramDiscount?: number;
  // Para produtos com variantes, isso representa a receita total gerada pelas compras do programa de referência em todas as variantes
  totalVariantReferralProgramRevenue?: number;
  // Para produtos com variantes, isso representa o lucro total gerado pelas compras do programa de referência em todas as variantes
  totalVariantReferralProgramProfit?: number;
  // Para produtos com variantes, isso representa a porcentagem média de margem de lucro das compras do programa de referência em todas as variantes
  avgVariantReferralProgramProfitMargin?: number;
  // Para produtos com variantes, isso representa o número total de vezes que variantes foram apresentadas em campanhas de upsell
  totalVariantUpsellCampaigns?: number;
  // Para produtos com variantes, isso representa a receita adicional média gerada por campanhas de upsell em todas as variantes
  avgVariantUpsellRevenue?: number;
  // Para produtos com variantes, isso representa a receita total gerada por campanhas de upsell em todas as variantes
  totalVariantUpsellCampaignRevenue?: number;
  // Para produtos com variantes, isso representa o lucro total gerado por campanhas de upsell em todas as variantes
  totalVariantUpsellCampaignProfit?: number;
  // Para produtos com variantes, isso representa a porcentagem média de margem de lucro de campanhas de upsell em todas as variantes
  avgVariantUpsellCampaignProfitMargin?: number;
  // Para produtos com variantes, isso representa o número total de vezes que variantes foram apresentadas em campanhas de vendas cruzadas
  totalVariantCrossSellCampaigns?: number;
  // Para produtos com variantes, isso representa a receita adicional média gerada por campanhas de vendas cruzadas em todas as variantes
  avgVariantCrossSellRevenue?: number;
  // Para produtos com variantes, isso representa a receita total gerada por campanhas de vendas cruzadas em todas as variantes
  totalVariantCrossSellCampaignRevenue?: number;
  // Para produtos com variantes, isso representa o lucro total gerado por campanhas de vendas cruzadas em todas as variantes
  totalVariantCrossSellCampaignProfit?: number;
  // Para produtos com variantes, isso representa a porcentagem média de margem de lucro de campanhas de vendas cruzadas em todas as variantes
  avgVariantCrossSellCampaignProfitMargin?: number;

}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  stock: number;
  barcode?: string;
  salePrice?: number;
}

export interface RecipeItem {
  supplyId: string;
  quantity: number;
  unit: string;
}

export interface Supply {  
  linkedProducts: any;
  id: string;
  name: string;
  packageCost: number;
  packageSize: number;
  unit: string;
  stockQuantity: number;
  minStockLevel?: number;
  businessId: string;
  imageUrl?: string; 
  imagePath?: string;
  
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  businessId: string;
  customerId?: string;
  origin: string;
  date: string;
  paymentDetails: PaymentDetail[];
  sessionId?: string;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  cashierId: string;
  cashierName: string;
  orderId?: string;
  tableId?: string;
  tableName?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  status: 'completed' | 'pending' | 'canceled' | 'refunded' | 'in_progress';
  observation?: string;
  discount?: number;  
  taxAmount?: number; 
  voucherCode?: string; 
  loyaltyPointsEarned?: number; 
  loyaltyPointsRedeemed?: number; 
  isSynced?: boolean; // Indica se a venda foi sincronizada com um sistema externo
  externalSystemId?: string; // ID da venda no sistema externo, se aplicável
  createdBy: {
    uid: string;
    name: string;
  };
  updatedBy?: {
    uid: string;
    name: string;
  };  
  cancellationReason?: string; // Motivo do cancelamento, se aplicável
  refundReason?: string; // Motivo do reembolso, se aplicável
  refundedBy?: {
    uid: string;
    name: string;
  };
  refundedAt?: Date | { toDate: () => Date };
  isOffline?: boolean; // Indica se a venda foi realizada offline
  offlineSyncAt?: Date | { toDate: () => Date }; // Data da última sincronização offline
  fiscalReceiptNumber?: string; // Número do cupom fiscal, se aplicável
  fiscalDocumentId?: string; // ID do documento fiscal, se aplicável  
  taxDetails?: {
    taxRate: number; // Em porcentagem, ex: 17 para 17%
    taxAmount: number; // Valor do imposto
  }[];  
  paymentStatus?: 'paid' | 'unpaid' | 'partially_paid'; // Status do pagamento
  amountPaid?: number; // Valor total pago
  amountDue?: number; // Valor restante a pagar
  changeGiven?: number; // Troco dado ao cliente
  isGift?: boolean; // Indica se a venda foi um presente
  giftMessage?: string; // Mensagem de presente, se aplicável
  couponCode?: string; // Código do cupom de desconto, se aplicável
  couponDiscount?: number; // Valor do desconto do cupom, se aplicável  
  affiliateId?: string; // ID do afiliado, se aplicável
  affiliateCommission?: number; // Comissão do afiliado, se aplicável
  deliveryPartner?: string; // Nome do parceiro de entrega, se aplicável
  deliveryPartnerFee?: number; // Taxa do parceiro de entrega, se aplicável
  estimatedDeliveryTime?: string; // Tempo estimado de entrega, se aplicável
  actualDeliveryTime?: string; // Tempo real de entrega, se aplicável
  feedbackScore?: number; // Avaliação do cliente, se aplicável
  feedbackComments?: string; // Comentários do cliente, se aplicável
  isLoyaltyRedemption?: boolean; // Indica se a venda envolveu resgate de pontos de fidelidade
  loyaltyRedemptionDetails?: {
    pointsRedeemed: number;
    rewardId: string;
    rewardDescription: string;
  };
  finalAmount?: number; // Valor final após descontos, impostos e taxas
  paymentMethodDetails?: {
    method: 'dinheiro' | 'cartao' | 'pix' | 'voucher';
    amount: number;
    transactionId?: string; // ID da transação, se aplicável
    cardType?: string; // Tipo de cartão, se aplicável
    last4Digits?: string; // Últimos 4 dígitos do cartão, se aplicável
  }[];

}

export interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  salePrice: number;
  costPrice?: number;
  observation?: string;
}

export interface PaymentDetail {
  method: 'dinheiro' | 'cartao' | 'pix' | 'voucher';
  amountPaid: number;
  change?: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  isPartner: boolean;
  businessId?: string;
  associatedBusinesses?: string[];
}

export interface Table {
  id: string;
  name: string;
  number: number;
  status: 'livre' | 'ocupada' | 'pagamento';
  currentOrderId?: string;
  businessId: string;
  places?: number;
  location?: string;
}

export interface Order {
  addressDetails: {};
  delivery: any;
  id: string;
  date: string;

  origin: 'dine_in' | 'delivery' | 'takeaway';
  customerName?: string;
  stomerPhone?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  tableId: string;
  orderNumber: number;
  finalAmount: number;
  observation?: string;
  paymentDetails: PaymentDetail[];
  tableName: string;
  businessId: string;
  status: 'open' | 'closed' | 'canceled' | 'processing' | 'in_transit' | 'delivered' | 'preparo' | 'analise' | 'finished';
  items: OrderItem[];
  totalAmount: number;
  customerId?: string;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  businessId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  icon?: string;
  color: string;
  businessId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  urgent: any;
  removals: any;
  removals: boolean;
  additions: any;
  additions: boolean;
  additions: any;
  id: any;
  cartItemId: any;
  productId: string;
  name: string;
  qty: number;
  salePrice: number;
  observation?: string;
}

export interface DeliveryFee {
  id: string;
  neighborhood: string;
  fee: number;
  businessId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  broadcastLists?: string[];
  birthDate?: string;
  customerId: string;
  lastOrderDate?: string;
  loyaltyPoints?: number;
  loyaltyLevel?: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';
  creditLimit?: number;
  currentBalance?: number;
  totalSpent?: number;
  orderCount?: number;
  createdAt?: any;

  // --- NOVOS CAMPOS ADICIONADOS ---
  wantsToParticipateInDraws?: boolean;
  lotteryCode?: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'penalty';
  points: number;
  description: string;
  orderId?: string;
  rewardId?: string;
  createdAt: any;
  businessId: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  type: 'discount' | 'freeItem' | 'gift' | 'upgrade';
  value?: number;
  productId?: string;
  isActive: boolean;
  businessId: string;
  createdAt: any;
}

export interface LoyaltySettings {
  id: string;
  businessId: string;
  pointsPerReal: number;
  bonusRules: {
    birthdayBonus: number;
    anniversaryBonus: number;
    referralBonus: number;
  };
  levelThresholds: {
    bronze: number;
    prata: number;
    ouro: number;
    diamante: number;
  };
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'rascunho' | 'enviado_ao_fornecedor' | 'confirmado_pelo_fornecedor' | 'enviado' | 'concluido' | 'cancelado';
  createdAt: string;
  notes?: string;
  businessId: string;
}

export interface PurchaseOrderItem {
  supplyId: string;
  quantity: number;
  unitCost: number;
  _productName?: string;
}

export interface CashierSession {
  id: string;
  businessId: string;
  status: 'open' | 'closed';
  openedAt: Date;
  openedBy: {
    uid: string;
    name: string;
  };
  openingBalance: number;
  closedAt?: Date;
  closedBy?: {
    uid: string;
    name: string;
  };
  closingReport?: any; // Armazena o relatório detalhado do fechamento
  closingBalance?: number;
  totalSales?: number;
  totalCashPayments?: number;
  totalCardPayments?: number;
  totalPixPayments?: number;
  totalVouchers?: number;
  totalExpenses?: number;
  totalCashIn?: number;
  totalCashOut?: number;
  

}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  installments: number;
  dueDate: Date;
  paidInstallments: number;
}