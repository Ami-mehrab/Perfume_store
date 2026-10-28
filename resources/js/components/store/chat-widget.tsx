import { usePage } from '@inertiajs/react';
import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { translate } from '@/lib/i18n';

export default function ChatWidget({ raised }: { raised: boolean }) {
    const { store, locale } = usePage().props;
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const [open, setOpen] = useState(false);
    const digits = store.whatsapp_phone.replace(/\D/g, '');
    const whatsapp = digits === '' ? '' : `https://wa.me/${digits}?text=${encodeURIComponent(store.name)}`;
    const messenger = store.messenger_url;

    if (whatsapp === '' && messenger === '') {
        return null;
    }

    return (
        <div className={`fixed right-4 z-50 ${raised ? 'bottom-24 md:bottom-6' : 'bottom-6'}`}>
            {open && (
                <div className="mb-3 w-56 rounded-2xl bg-white p-3 text-charcoal shadow-2xl">
                    <p className="px-1 pb-2 text-sm font-semibold">{t('chatWithUs')}</p>
                    <div className="space-y-2">
                        {whatsapp !== '' && (
                            <a className="flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2.5 text-sm font-semibold text-white" href={whatsapp} target="_blank" rel="noreferrer">
                                <WhatsAppIcon />
                                {t('chatOnWhatsapp')}
                            </a>
                        )}
                        {messenger !== '' && (
                            <a className="flex items-center gap-2 rounded-lg bg-[#0084ff] px-3 py-2.5 text-sm font-semibold text-white" href={messenger} target="_blank" rel="noreferrer">
                                <MessengerIcon />
                                {t('chatOnMessenger')}
                            </a>
                        )}
                    </div>
                </div>
            )}
            <button
                type="button"
                className="grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg"
                aria-label={t('chatWithUs')}
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </button>
        </div>
    );
}

export function WhatsAppIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.2 1.1-1.7 1.2-.4 0-.9.2-3.1-.6-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.8 2 .8 2.1.1.2 0 .3-.1.5l-.3.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.7-.8c.2-.2.3-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.3 0 .7-.2 1.1z" />
        </svg>
    );
}

export function MessengerIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
            <path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.3S17.5 2 12 2zm1 12.5-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7z" />
        </svg>
    );
}
