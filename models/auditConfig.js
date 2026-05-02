export default (sequelize, DataTypes) => {
	const AuditConfig = sequelize.define(
		"AuditConfig",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			resource: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			action: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			enabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
			},
		},
		{
			tableName: "audit_config",
			timestamps: true,
			paranoid: false,
		}
	);

	return AuditConfig;
};
