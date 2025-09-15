import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
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
  onOrderHistory?: () => void;
  onAddresses?: () => void;
  onSettings?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onOrderHistory,
  onAddresses,
  onSettings,
}) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
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