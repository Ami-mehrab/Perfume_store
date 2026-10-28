import { Form, Head, Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const fieldClass =
    'mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-ivory outline-none placeholder:text-white/35 transition focus:border-[#f9a8d4]/60 focus:bg-white/10';

export default function Login({ status, canResetPassword }: Props) {
    const { store: shop } = usePage().props;

    return (
        <div className="atelier-login relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10 text-ivory">
            <Head title="Admin sign in" />

            <div className="atelier-login-bg" aria-hidden="true">
                <span className="atelier-glow atelier-glow-a" />
                <span className="atelier-glow atelier-glow-b" />
                <span className="atelier-glow atelier-glow-c" />
                <span className="atelier-mist" />
                <span className="atelier-bottle" />
                <span className="atelier-spark atelier-spark-1" />
                <span className="atelier-spark atelier-spark-2" />
                <span className="atelier-spark atelier-spark-3" />
            </div>

            <div className="atelier-login-card relative z-10 w-full max-w-[380px] rounded-3xl border border-white/12 bg-[#1a0f14]/70 px-7 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <p className="text-center font-serif text-4xl tracking-[0.08em] text-[#fbcfe8]">{shop.name}</p>
                <div className="atelier-login-line mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-[#f9a8d4] to-transparent" />
                <h1 className="mt-4 text-center text-sm tracking-[0.28em] text-white/80 uppercase">Admin</h1>
                <p className="mt-2 text-center text-xs leading-5 text-white/45">Sign in to manage the atelier</p>

                <Form {...store.form()} resetOnSuccess={['password']} className="mt-7 grid gap-4">
                    {({ processing, errors }) => (
                        <>
                            <label className="text-xs tracking-[0.16em] text-white/55 uppercase" htmlFor="email">
                                Email
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="admin@aurelle.test"
                                    className={fieldClass}
                                />
                            </label>
                            <InputError message={errors.email} className="text-[#fda4af]!" />

                            <label className="text-xs tracking-[0.16em] text-white/55 uppercase" htmlFor="password">
                                Password
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className={fieldClass}
                                />
                            </label>
                            <InputError message={errors.password} className="text-[#fda4af]!" />

                            <button
                                type="submit"
                                className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#9d174d] to-[#be185d] text-sm font-medium tracking-wide text-white transition hover:from-[#831843] hover:to-[#9d174d] disabled:opacity-50"
                                tabIndex={3}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Enter atelier
                            </button>

                            {canResetPassword && (
                                <Link
                                    href={request()}
                                    className="text-center text-xs text-white/45 underline decoration-white/25 underline-offset-4 hover:text-white/70"
                                    tabIndex={4}
                                >
                                    Forgot your password?
                                </Link>
                            )}
                        </>
                    )}
                </Form>

                {status && <p className="mt-4 text-center text-sm text-[#f9a8d4]">{status}</p>}
            </div>
        </div>
    );
}

Login.layout = (page: ReactNode) => <>{page}</>;
