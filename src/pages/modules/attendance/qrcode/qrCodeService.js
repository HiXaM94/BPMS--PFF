import { supabase, isSupabaseReady } from '../../../../services/supabase';

/**
 * QR Code Attendance Service
 * Handles fetching, generating, and validating daily QR tokens
 */

/**
 * Get today's QR code token for a specific company
 * @param {string} companyId - UUID of the company
 * @returns {Promise<{token: string, date: string, generatedAt: string} | null>}
 */
export async function getTodayQRCode(companyId) {
    if (!isSupabaseReady) {
        // Fallback: generate a local demo token
        return getDemoToken();
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('daily_qr_codes')
        .select('secret_token, date, generated_at')
        .eq('company_id', companyId)
        .eq('date', today)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error('[QR Service] Error fetching today QR code:', error);
        return null;
    }

    if (!data) {
        // pg_cron hasn't generated today's token yet — generate it now
        console.log('[QR Service] No token for today, generating...');
        return await generateDailyToken(companyId);
    }

    return {
        token: data.secret_token,
        date: data.date,
        generatedAt: data.generated_at
    };
}

/**
 * Manually generate a daily token (fallback if pg_cron hasn't run)
 * @param {string} companyId
 */
export async function generateDailyToken(companyId) {
    if (!isSupabaseReady) return getDemoToken();

    const today = new Date().toISOString().split('T')[0];
    const token = `QR-${today.replace(/-/g, '')}-${generateRandomHex(16)}`;

    const { data, error } = await supabase
        .from('daily_qr_codes')
        .upsert({
            company_id: companyId,
            date: today,
            secret_token: token,
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            is_active: true
        }, { onConflict: 'company_id,date' })
        .select()
        .single();

    if (error) {
        console.error('[QR Service] Error generating token:', error);
        return getDemoToken();
    }

    return {
        token: data.secret_token,
        date: data.date,
        generatedAt: data.generated_at
    };
}

/**
 * Validate a scanned QR token against today's active token
 * @param {string} scannedToken - The token read from the QR code
 * @param {string} companyId - UUID of the company
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export async function validateScanToken(scannedToken, companyId) {
    if (!isSupabaseReady) {
        // Demo mode: accept any token that starts with QR-
        if (scannedToken && scannedToken.startsWith('QR-')) {
            return { valid: true, message: 'Token accepted (demo mode)' };
        }
        return { valid: false, message: 'Invalid QR code' };
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('daily_qr_codes')
        .select('secret_token')
        .eq('company_id', companyId)
        .eq('date', today)
        .eq('is_active', true)
        .maybeSingle();

    if (error || !data) {
        return { valid: false, message: 'No active QR code for today. Contact admin.' };
    }

    if (data.secret_token === scannedToken) {
        return { valid: true, message: 'Token validated successfully!' };
    }

    return { valid: false, message: 'Invalid or expired QR code. Please scan today\'s code.' };
}

// ── Helpers ──

function generateRandomHex(bytes) {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function getDemoToken() {
    const today = new Date().toISOString().split('T')[0];
    return {
        token: `QR-${today.replace(/-/g, '')}-demo-${generateRandomHex(8)}`,
        date: today,
        generatedAt: new Date().toISOString()
    };
}
