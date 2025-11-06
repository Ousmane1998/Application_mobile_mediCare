import { normalizePhone } from './phone';

export const sanitize = (s: string) => (s || '').replace(/[\t\n\r]+/g, ' ').trim();
export const hasDanger = (s: string) => /[<>]/.test(s || '');
export const isEmailValid = (s: string) => /^\S+@\S+\.\S+$/.test(s || '') && (s || '').length <= 100;
export const phoneDigits = (s: string) => normalizePhone(s || '');
export const isPhoneDigitsValid = (digits: string) => /^7\d{8}$/.test(digits || '');
export const isStrongPassword = (s: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(s || '');
export const isName = (s: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,50}$/.test(s || '');
export const isAgeValid = (s: string) => /^\d{1,3}$/.test(s || '') && Number(s) >= 0 && Number(s) <= 120;
export const isCodeValid = (s: string) => /^[A-Za-z0-9]{4,8}$/.test((s || '').toUpperCase());
