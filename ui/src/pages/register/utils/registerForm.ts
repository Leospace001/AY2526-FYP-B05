import * as yup from 'yup';

export enum RegisterFieldsNames {
  firstName = 'firstname',
  lastName = 'lastname',
  userName = 'username',
  email = 'email',
  password = 'password',
  confirmPassword = 'confirmpassword'
}

export const registerFormSchema = yup.object({
  [RegisterFieldsNames.firstName]: yup.string().required(),
  [RegisterFieldsNames.lastName]: yup.string().optional(),
  [RegisterFieldsNames.userName]: yup.string().required(),
  [RegisterFieldsNames.email]: yup.string().required(),
  [RegisterFieldsNames.password]: yup.string().required(),
  [RegisterFieldsNames.confirmPassword]: yup.string().required(),
});

export type RegisterForm = yup.InferType<typeof registerFormSchema>;
