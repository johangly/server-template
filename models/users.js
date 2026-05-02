export default (sequelize, DataTypes) => {
	const Users = sequelize.define(
		"Users",
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			code: {
				type: DataTypes.STRING,
				unique: true,
				allowNull: false,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING,
				unique: true,
				allowNull: false,
				validate: {
					isEmail: {
						msg: "El formato del correo electrónico no es válido.",
					},
				},
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			role: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "role",
					key: "id",
				},
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
			},
			lastLogin: {
				type: DataTypes.DATE,
				allowNull: true,
			},
		},
		{
			tableName: "users",
			timestamps: true,
			paranoid: false,
		}
	);

	Users.associate = function (models) {
		Users.belongsTo(models.Role, {
			foreignKey: "role",
			as: "userRole",
		});
	};

	return Users;

};