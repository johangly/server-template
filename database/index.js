'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import _config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const env = process.env.NODE_ENV || 'development';
const currentEnvConfig = _config[env];

const db = {};
let sequelize;

sequelize = new Sequelize(currentEnvConfig.database, currentEnvConfig.username, currentEnvConfig.password, {
  host: currentEnvConfig.host,
  port: parseInt(currentEnvConfig.port, 10),
  dialect: 'mysql',
  timezone: '-06:00',
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});

async function loadAndAssociateModels() {
  const modelFiles = fs
    .readdirSync(path.join(__dirname, '../models'))
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    });

  console.log("Modelos cargados:");
  for (const file of modelFiles) {
    const modelModule = await import(`../models/${file}`);
    const modelDefinitionFunction = modelModule.default;
    const model = modelDefinitionFunction(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
    console.log(`|||||| ${model.name} ||||||`);
  }

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.initialize = async () => {
  await loadAndAssociateModels();
};

export default db;
