import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  UserIcon, 
  ShoppingBagIcon, 
  LogOutIcon, 
  SettingsIcon,
  MapPinIcon
} from 'lucide-react';

interface UserProfileProps {
  onMyAccount?: () => void;
  onOrderHistory?: () => void;
  onAddresses?: () => void;
  onSettings?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onMyAccount,
  onOrderHistory,
  onAddresses,
  onSettings,
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 rounded-full bg-transparent border-0 cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {onMyAccount && (
          <DropdownMenuItem onClick={onMyAccount} className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>My Account</span>
          </DropdownMenuItem>
        )}
        
        {onOrderHistory && (
          <DropdownMenuItem onClick={onOrderHistory} className="cursor-pointer">
            <ShoppingBagIcon className="mr-2 h-4 w-4" />
            <span>Order History</span>
          </DropdownMenuItem>
        )}
        
        {onAddresses && (
          <DropdownMenuItem onClick={onAddresses} className="cursor-pointer">
            <MapPinIcon className="mr-2 h-4 w-4" />
            <span>Addresses</span>
          </DropdownMenuItem>
        )}
        
        {onSettings && (
          <DropdownMenuItem onClick={onSettings} className="cursor-pointer">
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};