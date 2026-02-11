<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Predračun {{ $proforma->proforma_number }}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151; background-color: #f9fafb;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; background-color: #111827; border-bottom: 3px solid #f59e0b;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                                Predračun {{ $proforma->proforma_number }}
                            </h1>
                            <p style="margin: 8px 0 0 0; font-size: 13px; color: #9ca3af;">
                                {{ $proforma->company?->name ?? '' }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <div style="color: #374151; font-size: 15px; line-height: 1.7;">
                                {!! nl2br(e($body)) !!}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">
                                Ovaj email je poslan automatski. Molimo ne odgovarajte na ovu poruku.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
