// ~/funnelmetrics/api/src/models/Subscription.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

// Tipos de planos disponíveis
export type PlanType = 'free' | 'basic' | 'professional' | 'enterprise';

interface SubscriptionAttributes {
  id: number;
  userId: number;
  planType: PlanType;
  status: 'active' | 'canceled' | 'expired' | 'pending';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionInput extends Optional<SubscriptionAttributes, 'id' | 'stripeCustomerId' | 'stripeSubscriptionId' | 'canceledAt' | 'createdAt' | 'updatedAt'> {}
export interface SubscriptionOutput extends Required<SubscriptionAttributes> {}

class Subscription extends Model<SubscriptionAttributes, SubscriptionInput> implements SubscriptionAttributes {
  public id!: number;
  public userId!: number;
  public planType!: PlanType;
  public status!: 'active' | 'canceled' | 'expired' | 'pending';
  public stripeCustomerId!: string;
  public stripeSubscriptionId!: string;
  public currentPeriodStart!: Date;
  public currentPeriodEnd!: Date;
  public cancelAtPeriodEnd!: boolean;
  public canceledAt!: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Métodos para verificar permissões baseadas no tipo de plano
  public canCreateProjects(count: number): boolean {
    const limits = {
      free: 1,
      basic: 3,
      professional: 10,
      enterprise: Infinity,
    };
    
    return count < limits[this.planType];
  }
  
  public canCreateFunnels(count: number): boolean {
    const limits = {
      free: 2,
      basic: 10,
      professional: 50,
      enterprise: Infinity,
    };
    
    return count < limits[this.planType];
  }
  
  public hasFeature(feature: string): boolean {
    const features = {
      free: ['basic_analytics'],
      basic: ['basic_analytics', 'advanced_analytics', 'export_data'],
      professional: ['basic_analytics', 'advanced_analytics', 'export_data', 'ab_testing', 'api_access'],
      enterprise: ['basic_analytics', 'advanced_analytics', 'export_data', 'ab_testing', 'api_access', 'white_label', 'priority_support'],
    };
    
    return features[this.planType].includes(feature);
  }
  
  // Verificar se a assinatura está ativa
  public isActive(): boolean {
    return this.status === 'active' && new Date() <= this.currentPeriodEnd;
  }
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    planType: {
      type: DataTypes.ENUM('free', 'basic', 'professional', 'enterprise'),
      allowNull: false,
      defaultValue: 'free',
    },
    status: {
      type: DataTypes.ENUM('active', 'canceled', 'expired', 'pending'),
      allowNull: false,
      defaultValue: 'active',
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => {
        // Por padrão, o período termina em 30 dias
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      },
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
  }
);

// Associação com o modelo de usuário
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });

export default Subscription;