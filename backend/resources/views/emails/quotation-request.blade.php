@php
    $due = $quotation->due_date?->format('l j F Y');
    $trade = strtolower($quotation->category->name);
    $ref = $quotation->contractorReference();
    $mb = fn ($bytes) => number_format($bytes / 1048576, 1).' MB';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $quotation->emailSubject() }}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;color:#1f2933;font-size:15px;line-height:1.5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:1100px;">
    <tr><td style="padding:12px 35px 32px;">
        @if ($reminder)
            <p style="margin:0 0 16px;padding:10px 14px;background:#fff5df;color:#9c6b20;border-radius:4px;font-size:14px;">
                Friendly reminder: we haven’t received your quote yet.
            </p>
        @endif

        <p style="margin:0 0 20px;">Hi {{ $contractor->name }},</p>
        <p style="margin:0 0 30px;">We’d like a quote for the {{ $trade }} work on the lot below. Please upload your quotation by {{ $due }}.</p>

        <p style="margin:0 0 4px;font-weight:600;">Project details</p>
        <p style="margin:0 0 30px;">Lot address: {{ $quotation->lot->address() }}@if ($quotation->lot->suburb), {{ $quotation->lot->suburb }}@endif
            @if ($quotation->lot->floor_plan)<br>Floor plan: {{ $quotation->lot->floor_plan }}@endif</p>

        <p style="margin:0 0 20px;font-weight:600;">Please include in your quote</p>
        <ul style="margin:0 0 30px;padding-left:20px;">
            <li style="margin-bottom:6px;">Total price, with GST shown separately</li>
            <li style="margin-bottom:6px;">Inclusions and exclusions</li>
            <li>How long your price is valid</li>
        </ul>

        <p style="margin:0 0 14px;font-weight:600;">Two ways to send your quote</p>
        <p style="margin:0;font-weight:600;">1. Upload it online (fastest)</p>
        <p style="margin:0 0 36px;">Attach your PDF or Excel file on our secure page. It’s logged against {{ $ref }} straight away.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{ $uploadUrl }}" style="display:inline-block;background:#d81e2b;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:3px;">Upload your quotation</a>
            <p style="margin:28px 0 0;font-size:12px;color:#5f6b76;">Button not working? Copy this link:<br>
                <a href="{{ $uploadUrl }}" style="color:#5f6b76;">{{ $uploadUrl }}</a></p>
        </td></tr></table>

        <p style="margin:44px 0 0;font-weight:600;">2. Or reply to this email</p>
        <p style="margin:0 0 30px;">Attach your PDF or Excel quote and keep <strong>{{ $ref }}</strong> in the subject line. Our estimating team will add it to the system for you.</p>

        @if ($quotation->documents->isNotEmpty())
            <p style="margin:0 0 16px;font-weight:600;">{{ $quotation->documents->count() }} {{ \Illuminate\Support\Str::plural('attachment', $quotation->documents->count()) }}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:10px;margin-left:-10px;">
                @foreach ($quotation->documents->chunk(3) as $row)
                    <tr>
                        @foreach ($row as $doc)
                            @php $xls = in_array(strtolower(pathinfo($doc->name, PATHINFO_EXTENSION)), ['xls', 'xlsx', 'csv']); @endphp
                            <td style="width:320px;border:1px solid #e5e9ec;border-radius:4px;padding:12px;vertical-align:middle;">
                                <span style="display:inline-block;vertical-align:middle;font-size:9px;font-weight:700;padding:4px 6px;border-radius:3px;background:{{ $xls ? '#e0f5e5' : '#ffe8e8' }};color:{{ $xls ? '#1c7d40' : '#f52232' }};">{{ $xls ? 'XLS' : 'PDF' }}</span>
                                <span style="display:inline-block;vertical-align:middle;margin-left:8px;font-size:13px;">{{ $doc->name }}<br><span style="font-size:11px;color:#89939b;">{{ $mb($doc->size) }}</span></span>
                            </td>
                        @endforeach
                    </tr>
                @endforeach
            </table>
        @endif

        <p style="margin:40px 0 0;">
            <img src="{{ $message->embed(public_path('images/truland-logo.png')) }}" alt="Truland Homes" width="200" height="67" style="display:block;">
        </p>
    </td></tr>
</table>
</body>
</html>
