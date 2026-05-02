export default (sequelize, DataTypes) => {
	const Permission = sequelize.define(
		"Permission",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING,
				unique: true,
				allowNull: false,
			},
			description: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			resource: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			action: {
				type: DataTypes.STRING,
				allowNull: false,
			},
		},
		{
			tableName: "permission",
			timestamps: true,
			paranoid: false,
		}
	);

	Permission.associate = function (models) {
		Permission.belongsToMany(models.Role, {
			through: models.RolePermission,
			foreignKey: "permissionId",
			otherKey: "roleId",
			as: "roles",
		});
	};

	return Permission;
};
