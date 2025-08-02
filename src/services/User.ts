// MOCK DATABASE - In a real app, use a proper database (e.g., PostgreSQL, MongoDB)
const users: any[] = [];
const passwordResets: Map<string, { otp: string, expires: Date }> = new Map();

// This service contains business logic for authentication.
// It's a placeholder and should be replaced with actual database interactions.
export const authService = {
    findUserByEmail: async (email: string) => users.find(u => u.email === email),

    findUserById: async (id: string) => users.find(u => u.id === id),
    
    findUserByWalletAddress: async (address: string) => users.find(u => u.walletAddress && u.walletAddress.toLowerCase() === address.toLowerCase()),

    createUser: async (userData: any) => {
        const newUser = { id: Date.now().toString(), ...userData, createdAt: new Date(), updatedAt: new Date() };
        users.push(newUser);
        console.log("Users in DB:", users);
        return newUser;
    },
    
    updateUser: async (id: string, updateData: any) => {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) return null;
        users[userIndex] = { ...users[userIndex], ...updateData, updatedAt: new Date() };
        return users[userIndex];
    },

    createPasswordResetOTP: (email: string, otp: string) => {
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        passwordResets.set(email, { otp, expires });
        console.log(`OTP for ${email}: ${otp}`); // For debugging
    },
    
    verifyPasswordResetOTP: (email: string, otp: string) => {
        const resetData = passwordResets.get(email);
        if (!resetData || resetData.otp !== otp || resetData.expires < new Date()) {
            return false;
        }
        return true;
    },

    clearPasswordResetOTP: (email: string) => {
        passwordResets.delete(email);
    }
};