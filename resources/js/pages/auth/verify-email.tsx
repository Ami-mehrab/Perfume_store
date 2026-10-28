import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { logout } from '@/routes';

export default function VerifyEmail() {
    return (
        <>
            <Head title="Email verification" />
            <TextLink href={logout()} className="mx-auto block text-sm">
                Log out
            </TextLink>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
