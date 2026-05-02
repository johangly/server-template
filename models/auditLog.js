export default (sequelize, DataTypes) => {
	const AuditLog = sequelize.define(
		"AuditLog",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			userId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			userEmail: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			action: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			resource: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			resourceId: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			oldValues: {
				type: DataTypes.JSON,
				allowNull: true,
			},
			newValues: {
				type: DataTypes.JSON,
				allowNull: true,
			},
			ip: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			userAgent: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
		},
		{
			tableName: "audit_log",
			timestamps: true,
			paranoid: false,
			updatedAt: false,
		}
	);

	AuditLog.associate = function (models) {
		AuditLog.belongsTo(models.Users, {
			foreignKey: "userId",
			as: "user",
			constraints: false,
		});
	};

	return AuditLog;
};
