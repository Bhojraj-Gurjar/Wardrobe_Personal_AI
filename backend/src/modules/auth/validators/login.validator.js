import { ValidatorConstraint, Validate } from 'class-validator';

export @ValidatorConstraint({ name: 'loginIdentifier', async: false })
class LoginIdentifierConstraint {
  validate(_value, args) {
    const { email, mobile } = args.object;
    return Boolean(email || mobile);
  }

  defaultMessage() {
    return 'Either email or mobile must be provided';
  }
}

export function ValidateLoginIdentifier() {
  return Validate(LoginIdentifierConstraint);
}
