// test_rpcs.js
import { createClient } from '@supabase/supabase-js';

const url = 'https://zhynmlxiiknrsduevlii.supabase.co';
const key = 'sb_publishable_YyQWyQZ_J1gv22fphCH48w_1S_NtMdW';
const supabase = createClient(url, key);

async function check() {
    console.log("Checking DB RPCs via standard fetch...");
    const res = await fetch(`${url}/rest/v1/`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    const paths = Object.keys(data.paths).filter(p => p.startsWith('/rpc/'));
    console.log("Available RPC functions:", paths);
}

check().catch(console.error);
