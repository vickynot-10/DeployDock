export interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
}

export interface SignInFormValues {
  email: string;
  password: string;
}

export interface SendOTPFormValues {
  email: string;
}

export interface VerifyOTPFormValues {
  email: string;
  otp:string;
}


export interface UpdatePasswordFormValues {
  email: string;
  password :string;
}

