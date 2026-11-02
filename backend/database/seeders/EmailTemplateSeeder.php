<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

/** The two emails the system sends. Safe to re-run: existing (possibly edited) templates are left alone. */
class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        EmailTemplate::firstOrCreate(['key' => EmailTemplate::QUOTATION_REQUEST], [
            'name' => 'Contractor quotation request',
            'description' => 'Sent to each contractor when a quotation is sent.',
            'subject' => 'Quotation Request {{quote_no}} – {{category}} – {{lot_short}}',
            'body' => <<<'HTML'
<p>Hi {{contractor_name}},</p>
<p>We’d like a quote for the {{category_lower}} work on the lot below. Please upload your quotation by {{due_date_long}}.</p>
<p><strong>Project details</strong><br>Lot address: {{lot_address}}{{#floor_plan}}<br>Floor plan: {{floor_plan}}{{/floor_plan}}</p>
{{#notes}}<p><strong>Notes from our team</strong><br>{{notes}}</p>{{/notes}}
<p><strong>Please include in your quote</strong></p>
<ul>
<li>Total price, with GST shown separately</li>
<li>Inclusions and exclusions</li>
<li>How long your price is valid</li>
</ul>
<p><strong>Two ways to send your quote</strong></p>
<p><strong>1. Upload it online (fastest)</strong><br>Attach your PDF or Excel file on our secure page. It’s logged against {{quote_no}} straight away.</p>
{{upload_button}}
<p><strong>2. Or reply to this email</strong><br>Attach your PDF or Excel quote and keep <strong>{{quote_no}}</strong> in the subject line. Our estimating team will add it to the system for you.</p>
HTML,
            'is_active' => true,
        ]);

        EmailTemplate::firstOrCreate(['key' => EmailTemplate::QUOTATION_REMINDER], [
            'name' => 'Contractor quotation reminder',
            'description' => 'Sent to contractors who haven’t responded, manually or automatically before the due date.',
            'subject' => 'Reminder: Quotation Request {{quote_no}} – {{category}} – {{lot_short}}',
            'body' => <<<'HTML'
<p>Hi {{contractor_name}},</p>
<p>Just a reminder that we’re still waiting on your quote for the {{category_lower}} work at {{lot_address}}. It’s due by {{due_date_long}}.</p>
{{upload_button}}
<p>If you’re not quoting on this one, a quick reply to let us know is appreciated.</p>
<p>Thank you,<br><strong>Truland Homes</strong></p>
HTML,
            'is_active' => true,
        ]);
    }
}
