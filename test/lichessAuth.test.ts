import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRedirect } from '../src/services/lichessAuth';

const arriveAt = (query: string) => {
  window.history.replaceState({}, '', `/chess-attack-visualization/${query}`);
};

const mockTokenEndpoint = () =>
  vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ access_token: 'granted-token' }),
    text: async () => '',
  })) as any;

describe('OAuth redirect handling', () => {
  beforeEach(() => {
    sessionStorage.clear();
    globalThis.fetch = mockTokenEndpoint();
  });

  it('does nothing on a plain page load', async () => {
    arriveAt('');
    await expect(handleRedirect()).resolves.toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('exchanges the code when the state matches what we sent', async () => {
    sessionStorage.setItem('codeVerifier', 'verifier-123');
    sessionStorage.setItem('oauthState', 'state-abc');
    arriveAt('?code=auth-code&state=state-abc');

    await expect(handleRedirect()).resolves.toBe('granted-token');

    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ code: 'auth-code', code_verifier: 'verifier-123' });
    // The query string is cleared so a refresh cannot replay the code.
    expect(window.location.search).toBe('');
  });

  it('refuses to redeem a code when the state does not match', async () => {
    sessionStorage.setItem('codeVerifier', 'verifier-123');
    sessionStorage.setItem('oauthState', 'state-abc');
    arriveAt('?code=attacker-code&state=state-WRONG');

    await expect(handleRedirect()).rejects.toThrow(/state mismatch/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('codeVerifier')).toBeNull();
  });

  it('refuses to redeem a code when no login was started in this session', async () => {
    arriveAt('?code=unsolicited-code&state=whatever');

    await expect(handleRedirect()).rejects.toThrow(/state mismatch/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('surfaces an authorization denial instead of hanging', async () => {
    sessionStorage.setItem('oauthState', 'state-abc');
    arriveAt('?error=access_denied&state=state-abc');

    await expect(handleRedirect()).rejects.toThrow(/denied authorization/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('oauthState')).toBeNull();
  });
});
