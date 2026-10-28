import { Link, router } from '@inertiajs/react';
import { LogOut, UserRound } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/routes';

type Props = {
    firstName: string;
    fullName: string;
    accountLabel: string;
    logOutLabel: string;
    accountHref?: string;
    side?: 'top' | 'bottom';
    align?: 'start' | 'center' | 'end';
    triggerClassName?: string;
    dock?: boolean;
};

export default function ShopperMenu({
    firstName,
    fullName,
    accountLabel,
    logOutLabel,
    accountHref = '/customer-account',
    side = 'bottom',
    align = 'end',
    triggerClassName,
    dock = false,
}: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={
                        triggerClassName ??
                        (dock
                            ? 'flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[11px] leading-tight text-charcoal'
                            : 'inline-flex max-w-28 items-center gap-1.5 text-sm')
                    }
                    aria-label={fullName}
                >
                    <UserRound className="size-5 shrink-0" />
                    <span className={dock ? 'max-w-full truncate' : 'truncate'}>{firstName}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side={side}
                align={align}
                sideOffset={dock ? 10 : 8}
                className="z-50 min-w-44 rounded-xl border border-line bg-white p-1.5 text-charcoal shadow-lg"
            >
                <div className="px-2.5 py-2">
                    <p className="truncate text-sm font-medium capitalize">{fullName}</p>
                </div>
                <DropdownMenuSeparator className="bg-line" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2 focus:bg-ivory">
                    <Link href={accountHref}>{accountLabel}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-line" />
                <DropdownMenuItem
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-red-700 focus:bg-red-50 focus:text-red-800"
                    onSelect={(event) => {
                        event.preventDefault();
                        router.post(logout.url());
                    }}
                >
                    <LogOut className="size-4" />
                    {logOutLabel}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
