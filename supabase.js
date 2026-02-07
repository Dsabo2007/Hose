// Initialize Supabase client - using window object only
(function () {
    window.SUPABASE_CONFIG = {
        url: 'https://zvrzqzgpowhwjozqophv.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cnpxemdwb3dod2pvenFvcGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzE4MzMsImV4cCI6MjA4NjA0NzgzM30.Mt1HYLQ1scmsGa-xJ8xR0Cobwi4NdlK7EyAJca2Cj80'
    };

    // Create client - overwrite window.supabase with our client
    if (typeof window.supabase === 'object' && typeof window.supabase.createClient === 'function') {
        // window.supabase is the SDK library
        const supabaseLib = window.supabase;
        // Create our client and replace window.supabase with it
        window.supabase = supabaseLib.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key
        );
    }
})();
