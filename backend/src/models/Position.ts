import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface PositionAttributes {
  id?: number;
  tradeId: number;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  unrealizedPnl: number;
  status: 'ACTIVE' | 'CLOSED';
  openedAt: Date;
  closedAt: Date | null;
}

class Position extends Model<PositionAttributes> implements PositionAttributes {
  declare id: number;
  declare tradeId: number;
  declare type: 'LONG' | 'SHORT';
  declare entryPrice: number;
  declare currentPrice: number;
  declare quantity: number;
  declare stopLoss: number | null;
  declare takeProfit: number | null;
  declare unrealizedPnl: number;
  declare status: 'ACTIVE' | 'CLOSED';
  declare openedAt: Date;
  declare closedAt: Date | null;
}

Position.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tradeId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('LONG', 'SHORT'), allowNull: false },
    entryPrice: { type: DataTypes.FLOAT, allowNull: false },
    currentPrice: { type: DataTypes.FLOAT, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
    stopLoss: { type: DataTypes.FLOAT, allowNull: true },
    takeProfit: { type: DataTypes.FLOAT, allowNull: true },
    unrealizedPnl: { type: DataTypes.FLOAT, defaultValue: 0 },
    status: { type: DataTypes.ENUM('ACTIVE', 'CLOSED'), defaultValue: 'ACTIVE' },
    openedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    closedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: 'Position', tableName: 'positions', timestamps: true }
);

export default Position;
