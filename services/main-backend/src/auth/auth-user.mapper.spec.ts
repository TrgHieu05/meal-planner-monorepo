import {
  toAuthUser,
  toGoogleIdTokenExchangeResponse,
} from './auth-user.mapper';

describe('auth-user.mapper', () => {
  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    userName: 'John',
    gender: 'M',
    dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
    profile: {
      userId: '550e8400-e29b-41d4-a716-446655440000',
    },
  };

  it('trims whitespace from mapped auth user names', () => {
    expect(
      toAuthUser({
        ...baseUser,
        userName: '  John  ',
      }),
    ).toEqual({
      id: baseUser.id,
      email: baseUser.email,
      userName: 'John',
      isOnboardingCompleted: true,
    });
  });

  it('falls back to the email local part when auth userName is blank', () => {
    expect(
      toGoogleIdTokenExchangeResponse({
        message: 'Xác thực Google thành công',
        accessToken: 'jwt-token',
        user: {
          ...baseUser,
          userName: '   ',
          gender: null,
          dateOfBirth: null,
          profile: null,
        },
      }),
    ).toEqual({
      message: 'Xác thực Google thành công',
      accessToken: 'jwt-token',
      user: {
        id: baseUser.id,
        email: baseUser.email,
        userName: 'user',
        isOnboardingCompleted: false,
      },
    });
  });
});