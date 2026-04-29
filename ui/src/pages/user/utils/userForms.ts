import * as yup from 'yup';

export enum AccountGeneralFieldsNames {
  username = 'username',
  password = 'password',
  confirmPassword = 'confirmPassword',
}

export const accountGeneralFormSchema = yup.object({
  [AccountGeneralFieldsNames.username]: yup.string().required('Username is required'),
  [AccountGeneralFieldsNames.password]: yup
    .string()
    .transform((value) => (value?.trim() ? value : ''))
    .min(6, 'Password must be at least 6 characters')
    .notRequired(),
  [AccountGeneralFieldsNames.confirmPassword]: yup
    .string()
    .transform((value) => (value?.trim() ? value : ''))
    .when(AccountGeneralFieldsNames.password, {
      is: (password: string) => !!password,
      then: (schema) => schema.required('Please confirm your new password').oneOf([yup.ref(AccountGeneralFieldsNames.password)], 'Passwords do not match'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

export type AccountGeneralForm = yup.InferType<typeof accountGeneralFormSchema>;
