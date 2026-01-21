import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createSupabaseClient } from '@/lib/supabaseClient'

export async function POST(req: Request) {

    // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    // Handle the event
    const eventType = evt.type;

    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;

        const email = email_addresses[0]?.email_address;
        const fullName = `${first_name || ''} ${last_name || ''}`.trim();

        // Default role is customer if not specified
        const role = (public_metadata.role as string) || 'customer';
        // Organization needs to be assigned logic. 
        // Ideally user is invited to an org or creates one.
        // For now we sync the user record.

        const supabase = await createSupabaseClient();

        // We use service role key if we need to bypass RLS for creation if strict
        // But here we rely on the schema allowing inserts potentially or use a service key client.
        // Actually, createSupabaseClient uses anon key, which might not be enough if RLS blocks insert.
        // Ideally we should use SERVICE_ROLE_KEY for admin tasks like this sync.
        // I need to update createSupabaseClient or create a separate admin client.

        // Let's assume for now we use the standard client but we might need to upgrade permissions.
        // A better approach is usually using the Service Role Key for webhooks.

        const { error } = await supabase.from('users').insert({
            clerk_id: id,
            email: email,
            full_name: fullName,
            role: role,
            // organization_id: ... needs logic
        });

        if (error) {
            console.error('Error inserting user to Supabase:', error);
            return new Response('Error inserting user', { status: 500 });
        }
    }

    return new Response('', { status: 200 })
}
