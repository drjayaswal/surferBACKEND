import { t } from "elysia";

const VerifyOtpSchema = t.Object({
  otp: t.Number(),
  email: t.String(),
});

const GenerateOtpSchema = t.Object({
  email: t.String(),
});

const SignupSchema = t.Object({
  name: t.String(),
  password: t.String(),
  email: t.String(),
});
const LoginSchema = t.Object({
  password: t.String(),
  email: t.String(),
});

type OtpType = (typeof VerifyOtpSchema)["static"];
type SignUpType = (typeof SignupSchema)["static"];

export {
  SignUpType,
  OtpType,
  VerifyOtpSchema,
  GenerateOtpSchema,
  SignupSchema,
  LoginSchema,
};
