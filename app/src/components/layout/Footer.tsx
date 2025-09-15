import React from 'react';
import { Leaf } from 'lucide-react';
import { Separator } from '../ui/separator';
import { config } from '../../config';

interface FooterProps {
  categories: any[];
  serverStatus?: string;
}

export function Footer({ categories, serverStatus = 'online' }: FooterProps) {
  return (
    <footer className="bg-gradient-to-r from-green-800 to-orange-800 text-white mt-16 bg-[rgba(0,130,27,0.92)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg">MercaFacil</span>
            </div>
            <p className="text-white/80">
              Tu tienda online de confianza para frutas y verduras frescas. 
              Productos naturales, entrega rápida.
            </p>
          </div>
          
          <div>
            <h4 className="mb-4 text-white">Categorías</h4>
            <ul className="space-y-2 text-white/80">
              {categories.slice(0, 4).map(category => (
                <li key={category.id}>{category.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-white">Contacto</h4>
            <div className="space-y-2 text-white/80">
              <p>📱 WhatsApp: +57 300 123 4567</p>
              <p>📧 info@mercafacil.com</p>
              <p>🚚 Entrega en Bogotá y alrededores</p>
              <p className="text-xs mt-2">
                Server: {serverStatus} • API: {config.api.baseUrl}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />
        
        <div className="text-center text-white/80">
          <p>&copy; 2024 MercaFacil. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}