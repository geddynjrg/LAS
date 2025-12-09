'use server';

import { registerECitizen } from '@/lib/api/register';
import { createSession } from '@/lib/session';

export async function ecitizenRegisterAction(userData: {
  email: string;
  name: string;
  id_number: string;
  mobile: string;
  krapin: string;
  dob: string;
  gender: string;
}) {
  try {
    const res = await registerECitizen({
      email: userData.email,
      name: userData.name,
      id_number: userData.id_number,
      mobile: userData.mobile,
      krapin: userData.krapin,
      dob: userData.dob,
      gender: userData.gender,
      auth_provider: 'ecitizen',
    });

    await createSession({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    });

    return { success: true };
  } catch (error) {
    console.error('eCitizen registration error:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'eCitizen registration failed',
    };
  }
}
