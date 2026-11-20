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
  fireEvent.change(screen.getByPlaceholderText('סיסמה'), { target: { value: 'sarisrael' } });
  fireEvent.click(screen.getAllByText('כניסה').at(-1));
  await screen.findByText(/שלום, מנהל/);
};

describe('app', () => {
  it('validates israeli id', () => {
    expect(validIsraeliId('000000018')).toBe(true);
    expect(validIsraeliId('123456789')).toBe(false);
  });

  it('admin can open every screen without crashing', async () => {
    await login('0544534345');
    for (const [k, s] of Object.entries(SCREENS)) {
      if (k === 'profile') fireEvent.click(screen.getByTitle('פרופיל אישי'));
      else fireEvent.click(screen.getByText(s.title, { selector: 'button' }));
      await waitFor(() => expect(screen.getByRole('heading', { name: s.title })).toBeTruthy());
      fireEvent.click(document.querySelector('header .back'));
      await waitFor(() => expect(screen.getByText(/שלום, מנהל/)).toBeTruthy());
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
    const sels = document.querySelectorAll('select');
    fireEvent.change(sels[2], { target: { value: 's1' } });
    fireEvent.change(document.querySelectorAll('select')[3], { target: { value: 'r1' } });
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

  it('local password reset with phone + id, then login with formatted phone', async () => {
    const { get, set, hashId } = await import('./store.js');
    set('users', [...get('users'), { id: 'x1', name: 'דוד כהן', phone: '0541234567', email: 'd@x.com', shiurId: 's1', rabbiId: 'r1', studentStatus: 'active', role: 'student', status: 'approved', idHash: await hashId('000000018'), pwHash: 'old' }]);
    render(<App />);
    fireEvent.click(screen.getByText(/שכחתי/));
    fireEvent.change(screen.getByPlaceholderText(/טלפון/), { target: { value: '0541234567' } });
    fireEvent.change(screen.getByPlaceholderText('תעודת זהות'), { target: { value: '000000018' } });
    fireEvent.change(screen.getByPlaceholderText('סיסמה חדשה'), { target: { value: 'newpass1' } });
    fireEvent.click(screen.getByText('אפס סיסמה'));
    await screen.findByPlaceholderText('סיסמה');
    fireEvent.change(screen.getByPlaceholderText(/טלפון/), { target: { value: '+972 54-123-4567' } });
    fireEvent.change(screen.getByPlaceholderText('סיסמה'), { target: { value: ' newpass1 ' } });
    fireEvent.click(screen.getAllByText('כניסה').at(-1));
    await screen.findByText(/שלום, דוד כהן/);
  });

  it('unknown phone cannot log in', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/טלפון/), { target: { value: '0541234567' } });
    fireEvent.change(screen.getByPlaceholderText('סיסמה'), { target: { value: 'sarisrael' } });
    fireEvent.click(screen.getAllByText('כניסה').at(-1));
    await screen.findByText(/הפרטים לא נמצאו/);
  });

  it('sub-admin cannot modify or delete the owner', async () => {
    const { get, updateUser, removeUser, set } = await import('./store.js');
    set('session', 'u1');
    expect(() => removeUser('u0')).toThrow();
    expect(() => updateUser('u0', { role: 'student' })).toThrow();
    expect(get('users').find((u) => u.id === 'u0').role).toBe('owner');
  });

  it('incomplete student is forced to the profile screen', async () => {
    const { get, set } = await import('./store.js');
    set('users', [...get('users'), { id: 'x2', name: 'דוד', phone: '0541234567', email: '', role: 'student', status: 'approved', pwHash: 'x' }]);
    set('session', 'x2');
    render(<App />);
    await screen.findByText(/יש להשלים את הפרופיל/);
  });
});
