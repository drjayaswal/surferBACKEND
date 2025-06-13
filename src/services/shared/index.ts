import db from "../../config/db";
import { SignupBody } from "../../types/auth.types";
import { random_otp } from "../../utils";
import { t } from "elysia";

const otp_schema = t.Object({
  phone: t.String(),
});

const generate_otp = (body: SignupBody) => {
  const generatedOTP = random_otp();
  console.log(generatedOTP);
  console.log(body.phone_number);
};

export { generate_otp };
