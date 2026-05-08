export default (sequelize, DataTypes) => {
	const SystemConfig = sequelize.define(
		'SystemConfig',
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			key: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			value: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			type: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: 'string',
			},
			description: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			tableName: 'system_config',
			timestamps: true,
			paranoid: false,
		}
	);

	return SystemConfig;
};
