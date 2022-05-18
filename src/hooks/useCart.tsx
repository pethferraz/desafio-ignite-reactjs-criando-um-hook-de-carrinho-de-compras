import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart]

      const productExistis = newCart.find(product => product.id === productId)

      const productStockAmount = await api.get<Stock>(`stock/${productId}`)
      .then(response => response.data.amount)

      const amount = productExistis ? productExistis.amount : 0
      const newAmount = amount + 1

      if(newAmount > productStockAmount){
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if(productExistis){
        productExistis.amount = newAmount
      } else {
        const product = await api.get<Product>(`products/${productId}`).then(response => response.data)
        product.amount = 1

        newCart.push(product)
      }
      
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]

      const productExistis = newCart.find(product => product.id === productId)

      if(productExistis){
        const removeProduct = newCart.filter(product => product.id !== productId)

        setCart(removeProduct)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeProduct))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return 
      }

      const productStockAmount = await api.get<Stock>(`stock/${productId}`)
      .then(response => response.data.amount)

      if(amount > productStockAmount){
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      const newCart = [...cart]

      const productExistis = newCart.find(product => product.id === productId)

      if(productExistis){
        const productAmount = newCart.map(product => {
          if(product.id === productId) {
            product.amount = amount
          }
          return product
        })
  
        setCart(productAmount)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productAmount))
      } else {
        throw Error()
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
