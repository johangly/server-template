import bcrypt from 'bcrypt';

export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};

export const comparePassword = async (password, hashedPassword) => {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
};
export function isBcryptHash(password) {
    return typeof password === 'string' && password.startsWith('$2') && password.length === 60;
}
