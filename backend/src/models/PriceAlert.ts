import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface PriceAlertAttributes {
  id?: number;
  targetPrice: number;
  direction: 'above' | 'below';
  triggered: boolean;
  triggeredAt: Date | null;
  createdAt?: Date;
}

class PriceAlert extends Model<PriceAlertAttributes> implements PriceAlertAttributes {
  declare id: number;
  declare targetPrice: number;
  declare direction: 'above' | 'below';
  declare triggered: boolean;
  declare triggeredAt: Date | null;
}

PriceAlert.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    targetPrice: { type: DataTypes.FLOAT, allowNull: false },
    direction: { type: DataTypes.ENUM('above', 'below'), allowNull: false },
    triggered: { type: DataTypes.BOOLEAN, defaultValue: false },
    triggeredAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: 'PriceAlert', tableName: 'price_alerts', timestamps: true }
);

export default PriceAlert;
