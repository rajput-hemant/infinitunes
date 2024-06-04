"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

import { Toaster } from "./ui/sonner";
import { TooltipProvider } from "./ui/tooltip";

type Props = {
  theme?: ThemeProviderProps;
  children: React.ReactNode;
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity } },
});

export default function Providers({ children, theme }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...theme}
    >
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryClientProvider>
      </SessionProvider>

      <Toaster />
    </ThemeProvider>
  );
}

console.log(`
                         .:^^:.                   
                       .YGGGGGP5?!.               
                       PBGGGGGJ   :^:             
                      .GBGGGGG:      ^.           
                       PBBBBGB~       ^.          
                       ^5Y5PGBY        !.         
                             :7.       ?!         
                                    .!YYJ         
                         ?GGP57:  ?5PP5YY.        
                         :BGGGGG? !P55YY7         
                    .:!!  YGGGGPG!:P55J~          
               .:!JPGBBB: :GGPPPPY~J!:            
            :!YPGGGGGGGG5  YPPPP55:               
          ^YPPPPPPPGGGP5Y. :P55555:               
         :55555PPPY?~:.     J5YYYY.               
         :YYYYYY!.          ^YJJJ?                
          !JJJY~:           :J???:                
           :7??!^!          ~?7~.                 
             .^!!^:      .:^^:                    
                 .........                        
                                                  
            Welcome to Infinitunes!
`);
