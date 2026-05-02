export default (sequelize, DataTypes) => {
	const Role = sequelize.define(
		"Role",
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
		},
		{
			tableName: "role",
			timestamps: true,
			paranoid: false,
		}
	);

	Role.associate = function (models) {
		Role.hasMany(models.Users, {
			foreignKey: "role",
			as: "users",
		});
		Role.belongsToMany(models.Permission, {
			through: models.RolePermission,
			foreignKey: "roleId",
			otherKey: "permissionId",
			as: "permissions",
		});
	};

	return Role;

};