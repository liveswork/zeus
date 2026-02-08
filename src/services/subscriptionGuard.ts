// src/services/subscriptionGuard.ts
import { UserProfile } from '../types';
import { db } from '../config/firebase';
import { doc, writeBatch, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

// Define os limites de cada plano
const PLAN_LIMITS = {
  free: {
    monthlyOrders: 200,
    users: 1,
    printers: 2,
    features: ['delivery', 'tables', 'cashier_basic', 'stock', 'products']
  },
  pro_1pc: {
    monthlyOrders: Infinity,
    users: Infinity,
    printers: Infinity,
    features: ['delivery', 'tables', 'cashier_full', 'stock', 'products', 'loyalty', 'coupons', 'reports_advanced', 'purchases']
  },
  ultra_network: {
    monthlyOrders: Infinity,
    users: Infinity,
    printers: Infinity,
    features: ['delivery', 'tables', 'cashier_full', 'stock', 'products', 'loyalty', 'coupons', 'reports_advanced', 'purchases', 'marketing_advanced']
  }
};

class SubscriptionGuard {
  private profile: UserProfile | null = null;

  setProfile(profile: UserProfile | null) {
    this.profile = profile;
  }

  /**
   * Verifica se o usuário tem acesso a uma determinada funcionalidade.
   * @param featureKey - A chave da funcionalidade (ex: 'loyalty', 'reports_advanced')
   */
  public hasAccess(featureKey: string): boolean {
    if (!this.profile || !this.profile.subscription) return false;
    
    // Superadmin tem acesso a tudo
    if (this.profile.role === 'superadmin') return true;
    
    const plan = PLAN_LIMITS[this.profile.subscription.planId];
    return plan.features.includes(featureKey);
  }

  /**
   * Verifica se o usuário ainda pode criar novos pedidos este mês.
   */
  public canCreateOrder(): boolean {
    if (!this.profile || !this.profile.subscription) return false;

    const { planId, monthlyOrders } = this.profile.subscription;
    const currentMonth = new Date().toISOString().slice(0, 7); // Formato YYYY-MM

    // Se o mês mudou, o contador é resetado no próximo registro de pedido
    if (monthlyOrders.month !== currentMonth) return true;

    return monthlyOrders.count < PLAN_LIMITS[planId].monthlyOrders;
  }

  /**
   * O núcleo do algoritmo: registra um novo pedido e atualiza o contador.
   * Esta função deve ser chamada APÓS a criação de um pedido/venda.
   */
  public async recordNewOrderUsage(): Promise<void> {
    if (!this.profile || !this.profile.subscription || !this.profile.uid) return;

    const userRef = doc(db, 'users', this.profile.uid);
    const currentMonth = new Date().toISOString().slice(0, 7);
    let newCount = 1;

    if (this.profile.subscription.monthlyOrders.month === currentMonth) {
      newCount = this.profile.subscription.monthlyOrders.count + 1;
    }

    // Usamos um batch para garantir a atomicidade da operação
    const batch = writeBatch(db);
    batch.update(userRef, {
      "subscription.monthlyOrders.count": newCount,
      "subscription.monthlyOrders.month": currentMonth,
      "subscription.status": this.isOverLimit(newCount) ? "overdue" : "active"
    });
    
    await batch.commit();
  }

  /**
   * Verifica se o usuário ultrapassou o limite do plano.
   */
  public isOverLimit(currentCount?: number): boolean {
    if (!this.profile || !this.profile.subscription) return true; // Bloqueia por padrão
    const { planId, monthlyOrders } = this.profile.subscription;
    const count = currentCount ?? monthlyOrders.count;
    return count >= PLAN_LIMITS[planId].monthlyOrders;
  }

  /**
   * Retorna a porcentagem de uso do limite de pedidos.
   */
  public getUsagePercentage(): number {
     if (!this.profile || !this.profile.subscription) return 0;
     const { planId, monthlyOrders } = this.profile.subscription;
     const limit = PLAN_LIMITS[planId].monthlyOrders;
     if (limit === Infinity) return 0;

     return (monthlyOrders.count / limit) * 100;
  }
}

// Exporta uma instância singleton do guardião
export const subscriptionGuard = new SubscriptionGuard();