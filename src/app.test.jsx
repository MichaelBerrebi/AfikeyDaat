// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from './App.jsx';
import { SCREENS } from './App.jsx';
import { validIsraeliId } from './store.js';

const mem = new Map();
const memStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  clear: () => mem.clear(),
};

beforeEach(() => {
  cleanup();
  vi.stubGlobal('localStorage', memStorage);
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
});

const login = async (phone) => {
  render(<App />);
  fireEvent.change(screen.getByPlaceholderText(/טלפון/), { target: { value: phone } });
  fireEvent.change(screen.getByPlaceholderText('סיסמה'), { target: { value: 'admin123' } });
  fireEvent.click(screen.getAllByText('כניסה').at(-1));
  await screen.findByText(/שלום, מנהל/);
};

describe('app', () => {
  it('validates israeli id', () => {
    expect(validIsraeliId('000000018')).toBe(true);
    expect(validIsraeliId('123456789')).toBe(false);
  });

  it('admin can open every screen without crashing', async () => {
    await login('0500000000');
    for (const s of Object.values(SCREENS)) {
      fireEvent.click(screen.getByText(s.title, { selector: 'button' }));
      await waitFor(() => expect(screen.getByRole('heading', { name: s.title })).toBeTruthy());
      fireEvent.click(document.querySelector('header .back'));
    }
  });

  it('registers with email, waits for approval, then logs in after admin approves', async () => {
    render(<App />);
    fireEvent.click(screen.getAllByText('הרשמה')[0]);
    const type = (ph, v) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } });
    type('שם מלא', 'דוד כהן');
    type(/טלפון/, '0541234567');
    type(/מייל/, 'David@Example.com');
    type('סיסמה', 'secret1');
    type('תעודת זהות', '000000018');
    const [, rabbiSel] = document.querySelectorAll('select');
    fireEvent.change(rabbiSel, { target: { value: 'r1' } });
    fireEvent.click(screen.getAllByText('הרשמה').at(-1));
    await screen.findByText('ממתין לאישור');
    const { get, set, logout } = await import('./store.js');
    expect(get('users').at(-1).email).toBe('david@example.com');
    expect(get('users').at(-1).idHash).not.toContain('000000018');
    set('users', get('users').map((u) => (u.email ? { ...u, status: 'approved' } : u)));
    await screen.findByText(/שלום, דוד כהן/);
    logout();
    cleanup();
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/טלפון/), { target: { value: 'david@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('סיסמה'), { target: { value: 'secret1' } });
    fireEvent.click(screen.getAllByText('כניסה').at(-1));
    await screen.findByText(/שלום, דוד כהן/);
  });

  it('unknown phone cannot log in', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/טלפון/), { target: { value: '0541234567' } });
    fireEvent.change(screen.getByPlaceholderText('סיסמה'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getAllByText('כניסה').at(-1));
    await screen.findByText(/הפרטים לא נמצאו/);
  });
});
