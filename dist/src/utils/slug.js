"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.generateShortId = generateShortId;
exports.generateUniqueSlug = generateUniqueSlug;
/**
 * Generate a URL-friendly slug from a string
 * Example: "Website Contact Form" -> "website-contact-form"
 */
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}
/**
 * Generate a random short ID (8 characters)
 * Example: "a7b3c9d2"
 */
function generateShortId(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Generate a unique slug with optional short ID suffix
 * Example: "website-contact-form-a7b3c9d2"
 */
function generateUniqueSlug(text, addShortId = true) {
    const baseSlug = slugify(text);
    if (!addShortId) {
        return baseSlug;
    }
    const shortId = generateShortId(6);
    return `${baseSlug}-${shortId}`;
}
