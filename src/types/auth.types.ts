import { t } from "elysia";

const VerifyLoginOtpSchema = t.Object({
  email: t.String(),
  otp: t.Number(),
});
const GenerateOtpSchema = t.Object({
  email: t.String(),
});
const VerifySignupOtpSchema = t.Object({
  name: t.String(),
  password: t.String(),
  email: t.String(),
  otp: t.Number(),
});

const SignupSchema = t.Object({
  name: t.String(),
  email: t.String(),
  password: t.String(),
});
const LoginSchema = t.Object({
  email: t.String(),
  password: t.String(),
});

type OtpType = (typeof VerifyLoginOtpSchema)["static"];
type SignUpType = (typeof SignupSchema)["static"];

export {
  SignUpType,
  OtpType,
  VerifyLoginOtpSchema,
  GenerateOtpSchema,
  SignupSchema,
  LoginSchema,
  VerifySignupOtpSchema,
};
