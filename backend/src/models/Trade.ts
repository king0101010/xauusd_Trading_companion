import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface TradeAttributes {
  id?: number;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number | null;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  openedAt: Date;
  closedAt: Date | null;
  notes: string | null;
}

class Trade extends Model<TradeAttributes> implements TradeAttributes {
  declare id: number;
  declare type: 'BUY' | 'SELL';
  declare entryPrice: number;
  declare exitPrice: number | null;
  declare quantity: number;
  declare stopLoss: number | null;
  declare takeProfit: number | null;
  declare pnl: number | null;
  declare status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  declare openedAt: Date;
  declare closedAt: Date | null;
  declare notes: string | null;
}

Trade.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM('BUY', 'SELL'), allowNull: false },
    entryPrice: { type: DataTypes.FLOAT, allowNull: false },
    exitPrice: { type: DataTypes.FLOAT, allowNull: true },
    quantity: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
    stopLoss: { type: DataTypes.FLOAT, allowNull: true },
    takeProfit: { type: DataTypes.FLOAT, allowNull: true },
    pnl: { type: DataTypes.FLOAT, allowNull: true },
    status: { type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED'), defaultValue: 'OPEN' },
    openedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    closedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Trade', tableName: 'trades', timestamps: true }
);

export default Trade;
