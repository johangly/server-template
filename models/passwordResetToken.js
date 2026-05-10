export default (sequelize, DataTypes) => {
	const PasswordResetToken = sequelize.define(
		'PasswordResetToken',
		{
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			userId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			token: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			expiresAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			used: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			tableName: 'password_reset_tokens',
			timestamps: true,
			paranoid: false,
			updatedAt: false, // Table only has createdAt, not updatedAt
		}
	);

	PasswordResetToken.associate = function (models) {
		PasswordResetToken.belongsTo(models.Users, {
			foreignKey: 'userId',
			as: 'user',
		});
	};

	return PasswordResetToken;
};
