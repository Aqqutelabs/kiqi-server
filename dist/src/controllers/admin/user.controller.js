"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.listUsers = exports.createUser = void 0;
const http_status_codes_1 = require("http-status-codes");
const User_1 = require("../../models/User");
// Create a user
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, password, organizationName } = req.body;
    try {
        const existingUser = yield User_1.UserModel.findOne({ email });
        if (existingUser) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ message: "Email already exists" });
        }
        const user = yield User_1.UserModel.create({
            firstName,
            lastName,
            email,
            password, // plain text for now, hash later
            organizationName,
            role: "user", // default role
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            message: "User created successfully",
            user,
        });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }
});
exports.createUser = createUser;
// Get all users
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.UserModel.find().select("-password -refreshToken -walletAddress"); // never send password
        const response = users.map((u) => ({
            _id: u._id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
        }));
        res.status(http_status_codes_1.StatusCodes.OK).json({ users: response });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }
});
exports.listUsers = listUsers;
// Get a single user by ID
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const user = yield User_1.UserModel.findById(id).select("-password -refreshToken -walletAddress");
        if (!user)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ message: "User not found" });
        res.status(http_status_codes_1.StatusCodes.OK).json({ user });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }
});
exports.getUser = getUser;
// Update user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("req.body:", req.body);
    const { id } = req.params;
    const updateData = Object.assign({}, req.body);
    // Prevent role from being updated
    if ("role" in updateData)
        delete updateData.role;
    try {
        // Find user by ID
        const user = yield User_1.UserModel.findById(id);
        if (!user) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ message: "User not found" });
        }
        // Merge updateData into user document
        console.log("Update data:", updateData);
        Object.assign(user, updateData);
        console.log("User before save:", user.toObject());
        // Save the user (triggers pre-save hooks if any)
        yield user.save();
        // Sanitize sensitive fields
        const _a = user.toObject(), { password, refreshToken, walletAddress } = _a, safeUser = __rest(_a, ["password", "refreshToken", "walletAddress"]);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "User updated successfully",
            user: safeUser,
        });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: err.message || "Something went wrong",
        });
    }
});
exports.updateUser = updateUser;
// Delete user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const user = yield User_1.UserModel.findByIdAndDelete(id);
        if (!user)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ message: "User not found" });
        res.status(http_status_codes_1.StatusCodes.OK).json({ message: "User deleted successfully" });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }
});
exports.deleteUser = deleteUser;
