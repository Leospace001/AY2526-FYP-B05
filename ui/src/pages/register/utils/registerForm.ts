import * as yup from 'yup';

export enum RegisterFieldsNames {
  firstName = 'firstname',
  lastName = 'lastname',
  userName = 'username',
  email = 'email',
  password = 'password',
  confirmPassword = 'confirmPassword',
  phone = 'phone'
}

export const registerFormSchema = yup.object({
  [RegisterFieldsNames.firstName]: yup.string().required(),
  [RegisterFieldsNames.lastName]: yup.string().optional(),
  [RegisterFieldsNames.userName]: yup.string().matches(/^\S*$/, 'Spaces are not allowed').required(),
  [RegisterFieldsNames.email]: yup.string().required(),
  [RegisterFieldsNames.phone]: yup.number().transform((value, originalValue) => originalValue === "" ? null : value)
    .nullable() // Allows the field to be empty
    .min(18, "Must be at least 18"),
  [RegisterFieldsNames.password]: yup.string().required(),
  [RegisterFieldsNames.confirmPassword]: yup.string().required(),
});

export type RegisterForm = yup.InferType<typeof registerFormSchema>;
