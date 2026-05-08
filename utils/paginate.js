import { Op } from 'sequelize';

export async function paginate(model, options = {}) {
    const {
        page = 1,
        limit = 10,
        search,
        searchFields = [],
        filters = {},
        order = [['createdAt', 'DESC']],
        include,
    } = options;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { ...filters };

    if (search && searchFields.length > 0) {
        where[Op.or] = searchFields.map(field => ({
            [field]: { [Op.like]: `%${search}%` }
        }));
    }

    const { count, rows } = await model.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order,
        ...(include ? { include } : {}),
    });

    return {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
    };
}
