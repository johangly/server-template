export default (sequelize, DataTypes) => {
	const RolePermission = sequelize.define(
		"RolePermission",
		{
			roleId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				references: {
					model: "role",
					key: "id",
				},
			},
			permissionId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				references: {
					model: "permission",
					key: "id",
				},
			},
		},
		{
			tableName: "role_permission",
			timestamps: true,
			paranoid: false,
		}
	);

	RolePermission.associate = function (models) {
		RolePermission.belongsTo(models.Role, {
			foreignKey: "roleId",
			as: "role",
		});
		RolePermission.belongsTo(models.Permission, {
			foreignKey: "permissionId",
			as: "permission",
		});
	};

	return RolePermission;
};
