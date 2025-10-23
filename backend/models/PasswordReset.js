import mongoose from "mongoose";

const PasswordResetSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email ou téléphone
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

PasswordResetSchema.index({ identifier: 1 });
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto

const PasswordReset = mongoose.model("PasswordReset", PasswordResetSchema);
export default PasswordReset;
