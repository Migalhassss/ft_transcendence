"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
function generateToken(app, payload) {
    return app.jwt.sign(payload);
}
